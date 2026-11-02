"""Endpoint Ruang Pengurus (semua hak akses diperiksa di server)."""
from __future__ import annotations

import re
from datetime import datetime

from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q, QuerySet
from django.http import FileResponse, HttpRequest
from django.utils import timezone
from django.conf import settings

from .auth import api_view
from .models import (
    AdminUser,
    Announcement,
    Article,
    AuditEvent,
    DonationConfirmation,
    InstitutionStats,
    Notification,
    NotificationDelivery,
    RentalItem,
    RentalRequest,
    Staff,
)
from .notify import kirim_ulang_delivery
from .ratelimit import cek_batas_laju, ip_dari_request
from .responses import baca_json, json_gagal, json_ok
from .serializers import (
    announcement_admin,
    article_admin,
    donation_admin,
    notification_admin,
    rental_admin,
    rental_item,
    staff_admin,
    stats_admin,
)
from .services import (
    TRANSISI_DONASI,
    TRANSISI_KONTEN,
    TRANSISI_PERSEWAAN,
    boleh_transisi,
    slugify,
)
from .storage import baca_bukti, path_bukti
from .validation import bersihkan_teks

import os
import secrets
import re
from pathlib import Path

PERAN_KONTEN = {"admin"}
PERAN_KONTEN_LIHAT = {"admin"}
PERAN_VERIFIKASI = {"admin"}
PERAN_VERIFIKASI_LIHAT = {"admin"}


def _ambil(model, pk: str):
    """Ambil satu objek dari model atau QuerySet (mis. select_for_update)."""
    sumber = model if isinstance(model, QuerySet) else model.objects.all()
    try:
        return sumber.filter(pk=pk).first()
    except (ValidationError, ValueError):
        return None


# ================= SESI =================


@api_view(["POST"], skip_csrf=True)
def login(request: HttpRequest):
    if not cek_batas_laju(f"login:{ip_dari_request(request)}", 8, 60):
        return json_gagal(429, "Terlalu banyak percobaan. Coba lagi beberapa saat.")

    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    email = bersihkan_teks(body.get("email")).lower()
    password = body.get("password") if isinstance(body.get("password"), str) else ""
    if not email or not password:
        return json_gagal(400, "Email dan password wajib diisi")

    user = AdminUser.objects.filter(email=email).first()
    if user is None or not check_password(password, user.password_hash):
        return json_gagal(401, "Email atau password salah")

    request.session.cycle_key()
    request.session["admin_id"] = str(user.id)
    request.session["admin_role"] = user.role
    return json_ok(
        {
            "nama": user.nama,
            "role": user.role,
            "peringatan": "Akun demo — ganti sebelum produksi",
        }
    )


@api_view(["POST"], skip_csrf=True)
def logout(request: HttpRequest):
    request.session.flush()
    return json_ok({"ok": True})


@api_view(["GET"], skip_csrf=True)
def session_info(request: HttpRequest):
    from .auth import admin_dari_sesi

    admin = admin_dari_sesi(request)
    if admin is None:
        return json_gagal(401, "Belum masuk")
    return json_ok({"nama": admin.nama, "role": admin.role, "email": admin.email})


# ================= STATISTIK =================


@api_view(["GET"], PERAN_KONTEN_LIHAT, skip_csrf=True)
def stats_list(_request: HttpRequest):
    items = InstitutionStats.objects.order_by("-created_at")[:20]
    return json_ok({"items": [stats_admin(item) for item in items]})


@api_view(["POST"], PERAN_KONTEN, skip_csrf=True)
def stats_create(request: HttpRequest):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    periode = bersihkan_teks(body.get("periode"))
    sumber = bersihkan_teks(body.get("sumber"))
    if not periode:
        return json_gagal(400, "Periode wajib diisi", {"errors": {"periode": "Periode wajib diisi"}})
    if not sumber:
        return json_gagal(
            400, "Sumber data wajib diisi", {"errors": {"sumber": "Sumber data wajib diisi"}}
        )

    def validasi_kelompok(arr, kunci: str, nama_persen: bool = False):
        if not isinstance(arr, list) or not arr:
            return None, f"{kunci} wajib diisi minimal satu baris"
        baris = []
        total = 0
        for item in arr:
            data = item if isinstance(item, dict) else {}
            label = bersihkan_teks(data.get("label"))
            kunci_angka = "persen" if kunci == "alokasi" else "jumlah"
            try:
                angka = int(str(data.get(kunci_angka, "")))
            except ValueError:
                return None, f"{kunci}: angka harus bilangan bulat ≥ 0"
            if not label:
                return None, f"{kunci}: label wajib diisi"
            if angka < 0:
                return None, f"{kunci}: angka harus bilangan bulat ≥ 0"
            baris.append({"label": label, "persen": angka} if nama_persen else {"label": label, "jumlah": angka})
            total += angka
        if nama_persen and total != 100:
            return None, f"alokasi: total persen harus tepat 100% (sekarang {total}%)"
        return (baris, total), None

    hasil_usia, galat = validasi_kelompok(body.get("usiaAgregat"), "usia")
    if galat:
        return json_gagal(400, galat, {"errors": {"usiaAgregat": galat}})
    hasil_pendidikan, galat = validasi_kelompok(body.get("pendidikanAgregat"), "pendidikan")
    if galat:
        return json_gagal(400, galat, {"errors": {"pendidikanAgregat": galat}})
    hasil_alokasi, galat = validasi_kelompok(body.get("alokasi"), "alokasi", True)
    if galat:
        return json_gagal(400, galat, {"errors": {"alokasi": galat}})

    # Guard: validasi sebelumnya menjamin ketiga hasil terisi.
    if not hasil_usia or not hasil_pendidikan or not hasil_alokasi:
        return json_gagal(500, "Kesalahan validasi internal")
    usia_baris, usia_total = hasil_usia
    pendidikan_baris, pendidikan_total = hasil_pendidikan
    alokasi_baris, _ = hasil_alokasi

    item = InstitutionStats.objects.create(
        periode=periode,
        sumber=sumber,
        usia_agregat={
            "ringkasBeranda": {
                "nilai": str(usia_total),
                "sumber": sumber,
                "periode": periode,
            },
            "rincian": usia_baris,
        },
        pendidikan_agregat={"total": pendidikan_total, "rincian": pendidikan_baris},
        alokasi={"rincian": alokasi_baris},
        approved_by=None,
    )
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="simpan-statistik",
        entity_type="InstitutionStats",
        entity_id=str(item.id),
    )
    return json_ok({"id": str(item.id)}, status=201)


# ================= DONASI =================


@api_view(["GET"], PERAN_VERIFIKASI_LIHAT, skip_csrf=True)
def donations_list(request: HttpRequest):
    status_filter = (request.GET.get("status") or "").strip()
    queryset = DonationConfirmation.objects.all()
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    items = queryset.order_by("-created_at")[:200]
    return json_ok({"items": [donation_admin(item) for item in items]})


@api_view(["PATCH"], PERAN_VERIFIKASI, skip_csrf=True)
def donation_status(request: HttpRequest, id: str):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    status_baru = bersihkan_teks(body.get("status"))
    alasan = bersihkan_teks(body.get("alasan"))
    try:
        versi = int(str(body.get("version", "")))
    except ValueError:
        versi = None

    if not alasan or len(alasan) < 5:
        pesan = "Alasan keputusan wajib diisi (minimal 5 karakter)"
        return json_gagal(400, pesan, {"errors": {"alasan": pesan}})
    if versi is None:
        pesan = "Muat ulang data dan coba lagi"
        return json_gagal(400, "Versi data tidak valid", {"errors": {"version": pesan}})

    with transaction.atomic():
        donasi = _ambil(
            DonationConfirmation.objects.select_for_update(), id
        )
        if donasi is None:
            return json_gagal(404, "Data donasi tidak ditemukan")
        if not boleh_transisi(TRANSISI_DONASI, donasi.status, status_baru):
            return json_gagal(
                409,
                f'Perubahan status dari "{donasi.status}" ke "{status_baru}" tidak diizinkan',
            )
        if donasi.version != versi:
            pesan = "Data sudah diubah petugas lain. Muat ulang data."
            return json_gagal(409, pesan, {"errors": {"version": pesan}})

        status_lama = donasi.status
        donasi.status = status_baru
        donasi.verified_by = request.admin.nama
        donasi.verified_at = timezone.now()
        donasi.keputusan_alasan = alasan
        donasi.version = versi + 1
        donasi.save(
            update_fields=[
                "status",
                "verified_by",
                "verified_at",
                "keputusan_alasan",
                "version",
            ]
        )
        AuditEvent.objects.create(
            actor_id=request.admin.id,
            aksi="ubah-status-donasi",
            entity_type="DonationConfirmation",
            entity_id=str(donasi.id),
            perubahan_status=f"{status_lama} -> {status_baru}",
        )

    return json_ok(
        {
            "id": str(donasi.id),
            "status": donasi.status,
            "version": donasi.version,
            "verifiedBy": donasi.verified_by,
        }
    )


# ================= PERSEWAAN =================


@api_view(["GET"], PERAN_VERIFIKASI_LIHAT, skip_csrf=True)
def rentals_list(request: HttpRequest):
    status_filter = (request.GET.get("status") or "").strip()
    queryset = RentalRequest.objects.all()
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    items = list(queryset.order_by("-created_at")[:200])
    item_ids = {item.rental_item_id for item in items}
    katalog = {item.id: item for item in RentalItem.objects.filter(id__in=item_ids)}
    return json_ok(
        {"items": [rental_admin(item, katalog.get(item.rental_item_id)) for item in items]}
    )


@api_view(["PATCH"], PERAN_VERIFIKASI, skip_csrf=True)
def rental_status(request: HttpRequest, id: str):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    status_baru = bersihkan_teks(body.get("status"))
    alasan = bersihkan_teks(body.get("alasan"))
    try:
        versi = int(str(body.get("version", "")))
    except ValueError:
        versi = None

    if not alasan or len(alasan) < 5:
        pesan = "Alasan keputusan wajib diisi (minimal 5 karakter)"
        return json_gagal(400, pesan, {"errors": {"alasan": pesan}})
    if versi is None:
        pesan = "Muat ulang data dan coba lagi"
        return json_gagal(400, "Versi data tidak valid", {"errors": {"version": pesan}})

    with transaction.atomic():
        sewa = _ambil(RentalRequest.objects.select_for_update(), id)
        if sewa is None:
            return json_gagal(404, "Data persewaan tidak ditemukan")
        if not boleh_transisi(TRANSISI_PERSEWAAN, sewa.status, status_baru):
            return json_gagal(
                409,
                f'Perubahan status dari "{sewa.status}" ke "{status_baru}" tidak diizinkan',
            )
        if sewa.version != versi:
            pesan = "Data sudah diubah petugas lain. Muat ulang data."
            return json_gagal(409, pesan, {"errors": {"version": pesan}})

        status_lama = sewa.status
        sewa.status = status_baru
        sewa.keputusan_alasan = alasan
        sewa.version = versi + 1
        sewa.save(update_fields=["status", "keputusan_alasan", "version"])
        AuditEvent.objects.create(
            actor_id=request.admin.id,
            aksi="ubah-status-persewaan",
            entity_type="RentalRequest",
            entity_id=str(sewa.id),
            perubahan_status=f"{status_lama} -> {status_baru}",
        )

    return json_ok({"id": str(sewa.id), "status": sewa.status, "version": sewa.version})


# ================= KATALOG =================


@api_view(["GET"], PERAN_KONTEN_LIHAT, skip_csrf=True)
def rental_items_admin(_request: HttpRequest):
    items = RentalItem.objects.order_by("nama")
    return json_ok({"items": [rental_item(item) for item in items]})


@api_view(["PATCH"], PERAN_KONTEN, skip_csrf=True)
def rental_item_update(request: HttpRequest):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    id = bersihkan_teks(body.get("id"))
    item = _ambil(RentalItem, id) if id else None
    if item is None:
        return json_gagal(404, "Item katalog tidak ditemukan")

    try:
        tarif = int(str(body.get("tarifContoh", "")))
    except ValueError:
        tarif = -1
    if tarif < 0 or tarif > 100_000_000:
        pesan = "Tarif harus bilangan bulat 0–100.000.000"
        return json_gagal(400, pesan, {"errors": {"tarifContoh": pesan}})

    status_baru = body.get("status")
    if status_baru not in {"terbit", "draf"}:
        status_baru = item.status
    status_lama = item.status
    item.tarif_contoh = tarif
    item.status = status_baru
    foto_url = _media_url(body)
    if foto_url:
        item.foto = foto_url
    update_fields = ["tarif_contoh", "status"]
    if foto_url:
        update_fields.append("foto")
    item.save(update_fields=update_fields)
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="ubah-tarif",
        entity_type="RentalItem",
        entity_id=str(item.id),
        perubahan_status=f"{status_lama} -> {status_baru}",
    )
    return json_ok(
        {"id": str(item.id), "tarifContoh": item.tarif_contoh, "status": item.status}
    )


# ================= PENGUMUMAN =================


@api_view(["GET"], PERAN_KONTEN_LIHAT, skip_csrf=True)
def announcements_admin(_request: HttpRequest):
    items = Announcement.objects.order_by("-created_at")
    return json_ok({"items": [announcement_admin(item) for item in items]})


@api_view(["POST"], PERAN_KONTEN, skip_csrf=True)
def announcement_create(request: HttpRequest):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    judul = bersihkan_teks(body.get("judul"))
    isi = bersihkan_teks(body.get("isi"))
    kategori = bersihkan_teks(body.get("kategori")) or "Umum"
    prioritas = "penting" if bersihkan_teks(body.get("prioritas")) == "penting" else "biasa"
    if len(judul) < 5 or len(judul) > 200:
        pesan = "Judul 5–200 karakter"
        return json_gagal(400, pesan, {"errors": {"judul": pesan}})
    if len(isi) < 5 or len(isi) > 2000:
        pesan = "Isi 5–2000 karakter"
        return json_gagal(400, pesan, {"errors": {"isi": pesan}})
    item = Announcement.objects.create(
        judul=judul, isi=isi, kategori=kategori, prioritas=prioritas, status="draf"
    )
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="buat-pengumuman",
        entity_type="Announcement",
        entity_id=str(item.id),
    )
    return json_ok({"id": str(item.id), "status": item.status}, status=201)


@api_view(["PATCH"], PERAN_KONTEN, skip_csrf=True)
def announcement_update(request: HttpRequest, id: str):
    item = _ambil(Announcement, id)
    if item is None:
        return json_gagal(404, "Pengumuman tidak ditemukan")
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")

    if isinstance(body.get("status"), str) and len(body) == 1:
        status_baru = bersihkan_teks(body.get("status"))
        if not boleh_transisi(TRANSISI_KONTEN, item.status, status_baru):
            return json_gagal(
                409, f'Perubahan status "{item.status}" → "{status_baru}" tidak diizinkan'
            )
        status_lama = item.status
        item.status = status_baru
        if status_baru == "terbit" and item.published_at is None:
            item.published_at = timezone.now()
        item.save(update_fields=["status", "published_at"])
        AuditEvent.objects.create(
            actor_id=request.admin.id,
            aksi="ubah-status-pengumuman",
            entity_type="Announcement",
            entity_id=str(item.id),
            perubahan_status=f"{status_lama} -> {status_baru}",
        )
        return json_ok({"id": str(item.id), "status": item.status})

    judul = bersihkan_teks(body.get("judul"))
    isi = bersihkan_teks(body.get("isi"))
    prioritas = "penting" if bersihkan_teks(body.get("prioritas")) == "penting" else "biasa"
    if judul and (len(judul) < 5 or len(judul) > 200):
        pesan = "Judul 5–200 karakter"
        return json_gagal(400, pesan, {"errors": {"judul": pesan}})
    if judul:
        item.judul = judul
    if isi:
        item.isi = isi
    item.prioritas = prioritas
    item.status = "draf"
    item.save()
    return json_ok({"id": str(item.id), "status": item.status})


@api_view(["DELETE"], PERAN_KONTEN, skip_csrf=True)
def announcement_delete(request: HttpRequest, id: str):
    item = _ambil(Announcement, id)
    if item is None:
        return json_gagal(404, "Pengumuman tidak ditemukan")
    if item.status == "terbit":
        return json_gagal(409, "Tarik dulu sebelum menghapus")
    item.delete()
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="hapus-pengumuman",
        entity_type="Announcement",
        entity_id=id,
    )
    return json_ok({"ok": True})


# ================= BERITA =================


def _media_url(body: dict) -> str | None:
    nilai = bersihkan_teks(body.get("mediaUrl"))
    if not nilai:
        return None
    if nilai.startswith("https://") or nilai.startswith("/"):
        return nilai[:500]
    return None


@api_view(["GET"], PERAN_KONTEN_LIHAT, skip_csrf=True)
def articles_admin(_request: HttpRequest):
    items = Article.objects.order_by("-created_at")
    return json_ok({"items": [article_admin(item) for item in items]})


@api_view(["POST"], PERAN_KONTEN, skip_csrf=True)
def article_create(request: HttpRequest):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    judul = bersihkan_teks(body.get("judul"))
    ringkasan = bersihkan_teks(body.get("ringkasan"))
    isi = bersihkan_teks(body.get("isi"))
    kategori = bersihkan_teks(body.get("kategori"))
    media_alt = bersihkan_teks(body.get("mediaAlt"))
    media_url = _media_url(body)
    consent = body.get("publicationConsent") is True

    errors: dict[str, str] = {}
    if len(judul) < 5 or len(judul) > 200:
        errors["judul"] = "Judul 5–200 karakter"
    if len(ringkasan) < 10 or len(ringkasan) > 400:
        errors["ringkasan"] = "Ringkasan 10–400 karakter"
    if len(isi) < 20 or len(isi) > 20_000:
        errors["isi"] = "Isi minimal 20 karakter"
    if not kategori:
        errors["kategori"] = "Kategori wajib diisi"
    if media_url and not consent and not media_alt:
        errors["mediaAlt"] = "Foto memerlukan teks alternatif dan izin tayang"
    if errors:
        return json_gagal(400, "Periksa isian", {"errors": errors})

    slug = slugify(judul)
    if Article.objects.filter(slug=slug).exists():
        slug = f"{slug}-{int(timezone.now().timestamp() * 1000):x}"

    artikel = Article.objects.create(
        slug=slug,
        judul=judul,
        ringkasan=ringkasan,
        isi=isi,
        kategori=kategori,
        media_url=media_url,
        media_alt=media_alt or None,
        publication_consent=consent,
        status="draf",
    )
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="buat-berita",
        entity_type="Article",
        entity_id=str(artikel.id),
    )
    return json_ok(
        {"id": str(artikel.id), "slug": artikel.slug, "status": artikel.status}, status=201
    )


@api_view(["PATCH"], PERAN_KONTEN, skip_csrf=True)
def article_update(request: HttpRequest, id: str):
    artikel = _ambil(Article, id)
    if artikel is None:
        return json_gagal(404, "Berita tidak ditemukan")
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")

    if isinstance(body.get("status"), str) and len(body) == 1:
        status_baru = bersihkan_teks(body.get("status"))
        if not boleh_transisi(TRANSISI_KONTEN, artikel.status, status_baru):
            return json_gagal(
                409, f'Perubahan status "{artikel.status}" → "{status_baru}" tidak diizinkan'
            )
        status_lama = artikel.status
        artikel.status = status_baru
        if status_baru == "terbit" and artikel.published_at is None:
            artikel.published_at = timezone.now()
        artikel.save(update_fields=["status", "published_at"])
        AuditEvent.objects.create(
            actor_id=request.admin.id,
            aksi="ubah-status-berita",
            entity_type="Article",
            entity_id=str(artikel.id),
            perubahan_status=f"{status_lama} -> {status_baru}",
        )
        return json_ok({"id": str(artikel.id), "status": artikel.status})

    judul = bersihkan_teks(body.get("judul"))
    ringkasan = bersihkan_teks(body.get("ringkasan"))
    isi = bersihkan_teks(body.get("isi"))
    kategori = bersihkan_teks(body.get("kategori"))
    media_alt = bersihkan_teks(body.get("mediaAlt"))
    media_url = _media_url(body)
    consent = body.get("publicationConsent") is True

    errors: dict[str, str] = {}
    if judul and (len(judul) < 5 or len(judul) > 200):
        errors["judul"] = "Judul 5–200 karakter"
    if ringkasan and (len(ringkasan) < 10 or len(ringkasan) > 400):
        errors["ringkasan"] = "Ringkasan 10–400 karakter"
    if isi and (len(isi) < 20 or len(isi) > 20_000):
        errors["isi"] = "Isi minimal 20 karakter"
    if media_url and not media_alt:
        errors["mediaAlt"] = "Foto memerlukan teks alternatif"
    if errors:
        return json_gagal(400, "Periksa isian", {"errors": errors})

    status_lama = artikel.status
    if judul:
        artikel.judul = judul
    if ringkasan:
        artikel.ringkasan = ringkasan
    if isi:
        artikel.isi = isi
    if kategori:
        artikel.kategori = kategori
    artikel.media_url = media_url
    artikel.media_alt = media_alt or None
    artikel.publication_consent = consent
    artikel.status = "draf"
    artikel.save()
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="sunting-berita",
        entity_type="Article",
        entity_id=str(artikel.id),
        perubahan_status=f"{status_lama} -> draf",
    )
    return json_ok({"id": str(artikel.id), "status": artikel.status})


@api_view(["DELETE"], PERAN_KONTEN, skip_csrf=True)
def article_delete(request: HttpRequest, id: str):
    artikel = _ambil(Article, id)
    if artikel is None:
        return json_gagal(404, "Berita tidak ditemukan")
    if artikel.status == "terbit":
        return json_gagal(409, "Berita terbit harus ditarik dulu sebelum dihapus")
    artikel.delete()
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="hapus-berita",
        entity_type="Article",
        entity_id=id,
    )
    return json_ok({"ok": True})


# ================= PENGASUH =================


@api_view(["GET"], PERAN_KONTEN_LIHAT, skip_csrf=True)
def staff_admin_list(_request: HttpRequest):
    items = Staff.objects.order_by("nama")
    return json_ok({"items": [staff_admin(item) for item in items]})


@api_view(["POST"], PERAN_KONTEN, skip_csrf=True)
def staff_create(request: HttpRequest):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    nama = bersihkan_teks(body.get("nama"))
    peran = bersihkan_teks(body.get("peran"))
    if len(nama) < 2 or len(nama) > 120:
        pesan = "Nama 2–120 karakter"
        return json_gagal(400, pesan, {"errors": {"nama": pesan}})
    if not peran:
        pesan = "Peran wajib diisi"
        return json_gagal(400, pesan, {"errors": {"peran": pesan}})
    foto = _media_url(body)
    item = Staff.objects.create(nama=nama, peran=peran, publication_consent=False, status="draf", foto=foto)
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="tambah-pengasuh",
        entity_type="Staff",
        entity_id=str(item.id),
    )
    return json_ok({"id": str(item.id)}, status=201)


@api_view(["PATCH"], PERAN_KONTEN, skip_csrf=True)
def staff_update(request: HttpRequest):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    id = bersihkan_teks(body.get("id"))
    item = _ambil(Staff, id) if id else None
    if item is None:
        return json_gagal(404, "Pengasuh tidak ditemukan")

    fields = []
    if "publicationConsent" in body:
        item.publication_consent = body.get("publicationConsent") is True
        fields.append("publication_consent")
    if body.get("status") in {"terbit", "draf"}:
        item.status = body["status"]
        fields.append("status")
    if fields:
        item.save(update_fields=fields)
    foto_url = _media_url(body)
    if foto_url:
        item.foto = foto_url
        item.save(update_fields=fields + ["foto"])
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="ubah-pengasuh",
        entity_type="Staff",
        entity_id=str(item.id),
    )
    return json_ok(
        {
            "id": str(item.id),
            "status": item.status,
            "publicationConsent": item.publication_consent,
        }
    )


# ================= AKUN =================


@api_view(["GET"], {"pengelola"}, skip_csrf=True)
def users_list(_request: HttpRequest):
    items = AdminUser.objects.order_by("nama")
    return json_ok(
        {
            "items": [
                {"id": str(item.id), "email": item.email, "nama": item.nama, "role": item.role}
                for item in items
            ]
        }
    )


@api_view(["PATCH"], {"pengelola"}, skip_csrf=True)
def user_update(request: HttpRequest):
    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Permintaan tidak valid")
    id = bersihkan_teks(body.get("id"))
    role = bersihkan_teks(body.get("role"))
    if role not in {"admin"}:
        pesan = "Peran tidak dikenal"
        return json_gagal(400, pesan, {"errors": {"role": pesan}})
    user = _ambil(AdminUser, id) if id else None
    if user is None:
        return json_gagal(404, "Akun tidak ditemukan")
    if user.id == request.admin.id and role != "admin":
        return json_gagal(409, "Admin tidak boleh menurunkan perannya sendiri")
    role_lama = user.role
    user.role = role
    user.save(update_fields=["role"])
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="ubah-peran",
        entity_type="AdminUser",
        entity_id=str(user.id),
        perubahan_status=f"{role_lama} -> {role}",
    )
    return json_ok({"id": str(user.id), "role": user.role})


# ================= NOTIFIKASI =================


@api_view(["GET"], PERAN_VERIFIKASI_LIHAT, skip_csrf=True)
def notifications_list(request: HttpRequest):
    jenis = (request.GET.get("jenis") or "").strip()
    status_filter = (request.GET.get("status") or "").strip()
    hanya_belum = request.GET.get("unread") == "1"

    queryset = Notification.objects.all()
    if jenis:
        queryset = queryset.filter(jenis=jenis)
    if hanya_belum:
        queryset = queryset.filter(dibaca_oleh__isnull=True)
    notifications = list(queryset.order_by("-created_at")[:100])

    donation_ids = [n.entity_id for n in notifications if n.entity_type == "DonationConfirmation"]
    rental_ids = [n.entity_id for n in notifications if n.entity_type == "RentalRequest"]
    status_donasi = {
        str(item.id): item.status
        for item in DonationConfirmation.objects.filter(id__in=donation_ids).only("id", "status")
    }
    status_sewa = {
        str(item.id): item.status
        for item in RentalRequest.objects.filter(id__in=rental_ids).only("id", "status")
    }

    delivery_map: dict[str, list[NotificationDelivery]] = {}
    for delivery in NotificationDelivery.objects.filter(
        notification_id__in=[n.id for n in notifications]
    ):
        delivery_map.setdefault(str(delivery.notification_id), []).append(delivery)

    items = []
    for notification in notifications:
        status_entitas = (
            status_donasi.get(notification.entity_id)
            if notification.entity_type == "DonationConfirmation"
            else status_sewa.get(notification.entity_id)
            if notification.entity_type == "RentalRequest"
            else None
        )
        items.append(
            notification_admin(
                notification,
                status_entitas,
                delivery_map.get(str(notification.id), []),
            )
        )
    if status_filter:
        items = [item for item in items if item["statusEntitas"] == status_filter]
    return json_ok({"items": items})


@api_view(["POST"], PERAN_VERIFIKASI_LIHAT, skip_csrf=True)
def notification_read(request: HttpRequest, id: str):
    notifikasi = _ambil(Notification, id)
    if notifikasi is None:
        return json_gagal(404, "Notifikasi tidak ditemukan")
    notifikasi.dibaca_oleh = request.admin.nama
    notifikasi.dibaca_at = timezone.now()
    notifikasi.save(update_fields=["dibaca_oleh", "dibaca_at"])
    return json_ok({"id": str(notifikasi.id), "dibaca": True})


@api_view(["POST"], PERAN_VERIFIKASI_LIHAT, skip_csrf=True)
def notification_resend(request: HttpRequest, id: str):
    body = baca_json(request) or {}
    delivery_id = body.get("deliveryId") if isinstance(body.get("deliveryId"), str) else ""
    if not delivery_id:
        return json_gagal(400, "deliveryId wajib diisi")
    notifikasi = _ambil(Notification, id)
    if notifikasi is None:
        return json_gagal(404, "Notifikasi tidak ditemukan")
    template_id = (
        "terima-pengajuan-donasi" if notifikasi.jenis == "donasi" else "terima-pengajuan-sewa"
    )
    ok, pesan = kirim_ulang_delivery(delivery_id, template_id, notifikasi.referensi)
    return json_ok({"ok": ok, "pesan": pesan}, status=200 if ok else 409)


# ================= BUKTI TRANSFER =================


@api_view(["GET"], PERAN_VERIFIKASI_LIHAT, skip_csrf=True)
def receipt_view(request: HttpRequest, key: str):
    receipt_key = (key or "")[:80]
    if not re.fullmatch(r"[a-f0-9]{16,64}\.[a-z0-9]{2,5}", receipt_key, re.IGNORECASE):
        return json_gagal(400, "Identitas bukti tidak sah")
    if not DonationConfirmation.objects.filter(receipt_key=receipt_key).exists():
        return json_gagal(404, "Bukti tidak ditemukan")
    hasil = baca_bukti(receipt_key)
    if hasil is None:
        return json_gagal(404, "Bukti tidak ditemukan")
    data, mime = hasil
    from io import BytesIO

    response = FileResponse(
        BytesIO(data),
        content_type=mime,
        as_attachment=False,
        filename=receipt_key,
    )
    response["Cache-Control"] = "no-store, private"
    response["X-Content-Type-Options"] = "nosniff"
    return response


# ================= DISPATCHER PATH BERSAMA =================
# Django memilih view pertama yang cocok tanpa melihat metode HTTP. Path yang
# dipakai GET+POST (atau PATCH+DELETE) karena itu diarahkan lewat dispatcher ini.


@api_view(["GET", "POST"], skip_csrf=True)
def stats_collection(request: HttpRequest):
    return stats_list(request) if request.method == "GET" else stats_create(request)


@api_view(["GET", "PATCH"], skip_csrf=True)
def rental_items_collection(request: HttpRequest):
    return rental_items_admin(request) if request.method == "GET" else rental_item_update(request)


@api_view(["GET", "POST"], skip_csrf=True)
def articles_collection(request: HttpRequest):
    return articles_admin(request) if request.method == "GET" else article_create(request)


@api_view(["PATCH", "DELETE"], skip_csrf=True)
def article_detail_collection(request: HttpRequest, id: str):
    return article_update(request, id) if request.method == "PATCH" else article_delete(request, id)


@api_view(["GET", "POST"], skip_csrf=True)
def announcements_collection(request: HttpRequest):
    return announcements_admin(request) if request.method == "GET" else announcement_create(request)


@api_view(["PATCH", "DELETE"], skip_csrf=True)
def announcement_detail_collection(request: HttpRequest, id: str):
    return (
        announcement_update(request, id)
        if request.method == "PATCH"
        else announcement_delete(request, id)
    )


@api_view(["GET", "POST", "PATCH"], skip_csrf=True)
def staff_collection(request: HttpRequest):
    if request.method == "GET":
        return staff_admin_list(request)
    return staff_create(request) if request.method == "POST" else staff_update(request)


@api_view(["GET", "PATCH"], skip_csrf=True)
def users_collection(request: HttpRequest):
    return users_list(request) if request.method == "GET" else user_update(request)


@api_view(["POST"], {"admin"}, skip_csrf=True)
def upload_media(request: HttpRequest):
    berkas = request.FILES.get("file")
    if berkas is None:
        return json_gagal(400, "Berkas wajib diunggah")
    if berkas.size > 5 * 1024 * 1024:
        return json_gagal(400, "Ukuran berkas melebihi 5 MB")
    nama = berkas.name or ""
    ext = nama.rsplit(".", 1)[-1].lower() if "." in nama else ""
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        return json_gagal(400, "Tipe berkas harus JPG, PNG, atau WebP")
    data = berkas.read()
    if not data:
        return json_gagal(400, "Berkas kosong")
    if data[0:2] == b"MZ" or data[0:2] == b"#!" or re.search(r"\.(exe|bat|cmd|sh|js|php)$", nama, re.IGNORECASE):
        return json_gagal(400, "Berkas ditolak oleh pemeriksaan keamanan")
    direktori = Path(settings.MEDIA_ROOT) / "uploads"
    direktori.mkdir(parents=True, exist_ok=True)
    nama_file = f"{secrets.token_hex(16)}.{ext}"
    (direktori / nama_file).write_bytes(data)
    url = f"{settings.MEDIA_URL}uploads/{nama_file}"
    AuditEvent.objects.create(
        actor_id=request.admin.id,
        aksi="upload-media",
        entity_type="MediaUpload",
        entity_id=nama_file,
    )
    return json_ok({"url": url, "namaFile": nama_file}, status=201)
