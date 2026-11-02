"""Tes kontrak API & aturan bisnis penting."""
from __future__ import annotations

import json

from django.contrib.auth.hashers import make_password
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .models import (
    AdminUser,
    Article,
    DonationConfirmation,
    Notification,
    RentalItem,
    RentalRequest,
    Staff,
)
from .pricing import hitung_estimasi, jumlah_hari_inklusif, parse_nominal_rupiah

# Origin header yang disertakan di setiap request tes (meniru browser).
ORIGIN = "http://localhost:3000"

TINY_PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d494844520000000100000001080600000"
    "01f15c4890000000d4944415478da63f8cf000000030001007b7f0d"
    "0a0000000049454e44ae426082"
)


class PricingTests(TestCase):
    def test_aula_vector(self):
        hasil = hitung_estimasi(
            jenis="aula",
            jumlah_sesi=1,
            tarif_aula=500_000,
            tambahan_aula=[
                {"nama": "Sound system", "tarif": 150_000},
                {"nama": "Kebersihan", "tarif": 50_000},
            ],
        )
        self.assertEqual(hasil["total"], 700_000)

    def test_kursi_vector(self):
        hasil = hitung_estimasi(
            jenis="kursi", jumlah_unit=40, jumlah_hari=2, tarif_per_unit_per_hari=5_000
        )
        self.assertEqual(hasil["total"], 400_000)

    def test_parse_nominal(self):
        self.assertEqual(parse_nominal_rupiah("Rp500.000"), 500_000)
        self.assertEqual(parse_nominal_rupiah("500000"), 500_000)
        for salah in ("", "0", "-5", "500,5", "abc", "00500"):
            self.assertIsNone(parse_nominal_rupiah(salah), salah)

    def test_jumlah_hari(self):
        self.assertEqual(jumlah_hari_inklusif("2026-04-10", "2026-04-12"), 3)
        self.assertIsNone(jumlah_hari_inklusif("2026-04-12", "2026-04-10"))


class PublicApiTests(TestCase):
    def setUp(self):
        Article.objects.create(
            slug="berita-terbit",
            judul="Berita Terbit",
            ringkasan="Ringkasan berita terbit.",
            isi="Isi berita yang cukup panjang untuk pengujian.",
            kategori="Kegiatan",
            status="terbit",
            publication_consent=True,
        )
        Article.objects.create(
            slug="berita-draf",
            judul="Berita Draf",
            ringkasan="Ringkasan berita draf.",
            isi="Isi berita draf yang tidak boleh tampil di publik.",
            kategori="Kegiatan",
            status="draf",
        )

    def test_articles_only_published(self):
        response = self.client.get("/api/articles")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual([item["slug"] for item in data["items"]], ["berita-terbit"])
        self.assertEqual(data["total"], 1)

    def test_article_detail_404_for_draft(self):
        self.assertEqual(self.client.get("/api/articles/berita-draf").status_code, 404)

    def test_rental_estimate_recomputed_on_server(self):
        item = RentalItem.objects.create(
            nama="Aula",
            jenis="aula",
            satuan="per sesi",
            tarif_contoh=500_000,
            tambahan=[{"nama": "Sound", "tarif": 150_000}, {"nama": "Bersih", "tarif": 50_000}],
            status="terbit",
        )
        payload = {
            "jenis": "aula",
            "rentalItemId": str(item.id),
            "penyewa": "Panitia Uji",
            "kontak": "081234567890",
            "alamat": "Jl. Uji No. 1",
            "jadwal": {"mulai": "2026-04-10", "selesai": "2026-04-11"},
            "rincianAula": {"kegiatan": "Rapat", "peserta": 20, "jamMulai": "08.00", "jamSelesai": "16.00"},
            "estimasiTotal": 1,  # diabaikan server
            "persetujuanDihubungi": True,
        }
        response = self.client.post(
            "/api/rental-requests",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY="uji-sewa-0001",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 201, response.content)
        sewa = RentalRequest.objects.get()
        self.assertEqual(sewa.estimasi_snapshot["total"], 1_400_000)

    def test_donation_upload_and_idempotency(self):
        data = {
            "nama": "Donatur Uji",
            "email": "donatur@contoh.id",
            "wa": "081234567890",
            "nominal": "Rp500.000",
            "keterangan": "Uji",
            "persetujuanVerifikasi": "true",
            "leaderboardConsent": "false",
            "bukti": SimpleUploadedFile("bukti.png", TINY_PNG, content_type="image/png"),
        }
        pertama = self.client.post(
            "/api/donation-confirmations", data=data, HTTP_IDEMPOTENCY_KEY="uji-donasi-0001",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(pertama.status_code, 201, pertama.content)
        referensi = pertama.json()["referensi"]
        self.assertEqual(DonationConfirmation.objects.count(), 1)
        self.assertEqual(Notification.objects.filter(jenis="donasi").count(), 1)

        kedua = self.client.post(
            "/api/donation-confirmations", data=data, HTTP_IDEMPOTENCY_KEY="uji-donasi-0001",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(kedua.status_code, 200)
        self.assertTrue(kedua.json()["duplikat"])
        self.assertEqual(kedua.json()["referensi"], referensi)
        self.assertEqual(DonationConfirmation.objects.count(), 1)

    def test_donation_rejects_fake_mime(self):
        data = {
            "nama": "Donatur Uji",
            "email": "donatur@contoh.id",
            "wa": "081234567890",
            "nominal": "500000",
            "persetujuanVerifikasi": "true",
            "bukti": SimpleUploadedFile("bukti.png", b"bukan-png", content_type="image/png"),
        }
        response = self.client.post(
            "/api/donation-confirmations", data=data, HTTP_IDEMPOTENCY_KEY="uji-donasi-0002",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("bukti", response.json()["errors"])


class AdminApiTests(TestCase):
    def setUp(self):
        self.admin = AdminUser.objects.create(
            email="admin@uji.id",
            nama="Admin Uji",
            role="admin",
            password_hash=make_password("rahasia123"),
        )
        self.staff = Staff.objects.create(
            nama="Ibu Uji", peran="Pengasuh", publication_consent=True, status="terbit"
        )
        self.donasi = DonationConfirmation.objects.create(
            referensi="DON-UJI-0001",
            idempotency_key="uji-admin-1",
            nama="Donatur",
            email="donatur@contoh.id",
            wa="081234567890",
            nominal_rupiah=100_000,
            receipt_key="a" * 32 + ".png",
            consent_at="2026-03-10T10:00:00+07:00",
            status="menunggu-verifikasi",
        )

    def login(self, email):
        return self.client.post(
            "/api/admin/login",
            data=json.dumps({"email": email, "password": "rahasia123"}),
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )

    def test_admin_can_verify_donation(self):
        self.login("admin@uji.id")
        ok = self.client.patch(
            f"/api/admin/donations/{self.donasi.id}/status",
            data=json.dumps({"status": "terverifikasi", "alasan": "Sudah dicek", "version": 1}),
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(ok.status_code, 200, ok.content)
        self.donasi.refresh_from_db()
        self.assertEqual(self.donasi.version, 2)
        self.assertEqual(self.donasi.verified_by, "Admin Uji")

    def test_version_lock_prevents_conflict(self):
        self.login("admin@uji.id")
        ok = self.client.patch(
            f"/api/admin/donations/{self.donasi.id}/status",
            data=json.dumps({"status": "terverifikasi", "alasan": "Bukti sesuai", "version": 1}),
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(ok.status_code, 200, ok.content)
        self.donasi.refresh_from_db()
        self.assertEqual(self.donasi.version, 2)

        conflict = self.client.patch(
            f"/api/admin/donations/{self.donasi.id}/status",
            data=json.dumps({"status": "ditolak", "alasan": "Coba lagi", "version": 1}),
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(conflict.status_code, 409)

    def test_staff_status_change_keeps_consent(self):
        self.login("admin@uji.id")
        response = self.client.patch(
            "/api/admin/staff",
            data=json.dumps({"id": str(self.staff.id), "status": "draf"}),
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.staff.refresh_from_db()
        self.assertEqual(self.staff.status, "draf")
        self.assertTrue(self.staff.publication_consent)

    def test_session_and_logout(self):
        self.assertEqual(self.client.get("/api/admin/session").status_code, 401)
        self.login("admin@uji.id")
        self.assertEqual(self.client.get("/api/admin/session").status_code, 200)
        self.client.post("/api/admin/logout", HTTP_ORIGIN=ORIGIN)
        self.assertEqual(self.client.get("/api/admin/session").status_code, 401)
