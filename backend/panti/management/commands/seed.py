"""Seed data demo LKSA Danukusumo.

Jalankan: python backend/manage.py seed
Data bersifat fiktif/CONTOH dan aman untuk pengembangan.
"""
from __future__ import annotations

import base64
import secrets
from datetime import datetime, timedelta, timezone as dt_timezone

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.utils import timezone

from panti.models import (
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

WIB = dt_timezone(timedelta(hours=7))

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)
TINY_PDF = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 90 >>
stream
BT /F1 14 Tf 40 120 Td (Bukti transfer tiruan untuk demo) Tj ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF"""


def wib(tahun: int, bulan: int, hari: int, jam: int = 9) -> datetime:
    return datetime(tahun, bulan, hari, jam, 0, tzinfo=WIB)


def tulis_bukti(ext: str) -> str:
    settings.RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)
    key = f"{secrets.token_hex(24)}.{ext}"
    (settings.RECEIPTS_DIR / key).write_bytes(TINY_PNG if ext == "png" else TINY_PDF)
    return key


class Command(BaseCommand):
    help = "Isi database dengan data demo LKSA Danukusumo (dilewati bila sudah ada)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Hapus seluruh data lama lalu isi ulang dengan data demo.",
        )

    def handle(self, *args, **options):
        if not options["reset"] and AdminUser.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Data sudah ada; seed dilewati. Gunakan --reset untuk mengisi ulang."
                )
            )
            return

        self.stdout.write("Mulai seed…")

        for model in (
            NotificationDelivery,
            Notification,
            AuditEvent,
            DonationConfirmation,
            RentalRequest,
            RentalItem,
            Article,
            Announcement,
            InstitutionStats,
            Staff,
            AdminUser,
        ):
            model.objects.all().delete()

        if options["reset"]:
            folder_bukti = settings.RECEIPTS_DIR
            if folder_bukti.exists():
                for berkas in folder_bukti.iterdir():
                    if berkas.is_file():
                        berkas.unlink()

        stats = InstitutionStats.objects.create(
            periode="Tahun Ajaran 2025/2026",
            sumber="Data internal lembaga",
            usia_agregat={
                "ringkasBeranda": {
                    "nilai": "34",
                    "sumber": "Data internal lembaga",
                    "periode": "Tahun Ajaran 2025/2026",
                },
                "ringkasAlumni": {
                    "nilai": "150+",
                    "sumber": "Data internal lembaga",
                    "periode": "Akumulasi sejak berdiri 2000",
                },
                "ringkasDonasi": {
                    "nilai": "34",
                    "sumber": "Data internal lembaga",
                    "periode": "Tahun Ajaran 2025/2026",
                },
                "rincian": [
                    {"label": "0–6 tahun", "jumlah": 1},
                    {"label": "7–12 tahun", "jumlah": 12},
                    {"label": "13–15 tahun", "jumlah": 9},
                    {"label": "16–18 tahun", "jumlah": 9},
                    {"label": "19 tahun ke atas", "jumlah": 3},
                ],
            },
            pendidikan_agregat={
                "total": 34,
                "rincian": [
                    {"label": "PAUD–SD/MI", "jumlah": 13},
                    {"label": "SMP/MTs", "jumlah": 9},
                    {"label": "SMA/SMK/MA", "jumlah": 9},
                    {"label": "Perguruan tinggi", "jumlah": 3},
                ],
            },
            alokasi={
                "rincian": [
                    {"label": "Pendidikan", "persen": 45},
                    {"label": "Makanan gizi", "persen": 30},
                    {"label": "Kesehatan", "persen": 15},
                    {"label": "Operasional", "persen": 10},
                ]
            },
            approved_by=None,
        )

        articles = [
            {
                "slug": "pembagian-perlengkapan-sekolah-awal-tahun",
                "judul": "Pembagian Perlengkapan Sekolah Awal Tahun Ajaran",
                "ringkasan": "Kegiatan pembagian perlengkapan sekolah untuk anak binaan menjelang tahun ajaran baru.",
                "isi": "Kegiatan pembagian perlengkapan sekolah dilaksanakan untuk anak binaan jenjang PAUD hingga SMA.\n\nPerlengkapan meliputi buku tulis, seragam, tas, dan alat tulis. Pendanaan berasal dari alokasi pendidikan sebagaimana tercantum pada halaman Pengurus Panti.\n\nTerima kasih kepada seluruh donatur dan relawan yang mendukung kelancaran kegiatan ini.",
                "kategori": "Kegiatan",
                "status": "terbit",
                "published_at": wib(2025, 7, 14),
                "publication_consent": True,
                "media_url": "/images/perlengkapan.jpg",
                "media_alt": "Pembagian perlengkapan sekolah untuk anak binaan",
            },
            {
                "slug": "kelas-mengaji-ramadhan-berjalan-reguler",
                "judul": "Kelas Mengaji Ramadhan Berjalan Reguler Setiap Pekan",
                "ringkasan": "Kelas mengaji dan tahsin berlangsung reguler dengan pembagian kelompok usia.",
                "isi": "Kelas mengaji berlangsung setiap pekan dengan pembagian kelompok usia.\n\nPengasuh pendamping berasal dari tim pengasuhan lembaga. Profil pengasuh hanya ditampilkan pada halaman Pengurus Panti dengan persetujuan masing-masing.\n\nKegiatan ini rutin dilaksanakan sepanjang tahun dan terbuka bagi seluruh anak binaan.",
                "kategori": "Kegiatan",
                "status": "terbit",
                "published_at": wib(2025, 3, 1),
                "publication_consent": True,
                "media_url": "/images/mengaji.jpg",
                "media_alt": "Kelas mengaji dengan pembagian kelompok usia",
            },
            {
                "slug": "pelatihan-mandi-cuci-jadwal-beres-untuk-adik-binaan",
                "judul": "Pelatihan Mandi, Cuci, dan Jadwal Beres untuk Adik Binaan",
                "ringkasan": "Program kemandirian harian untuk adik binaan usia sekolah dasar.",
                "isi": "Program kemandirian harian mencakup latihan mandi, mencuci pakaian sendiri, dan menjaga jadwal beres kamar.\n\nKegiatan dilaporkan berjalan bertahap dengan pendampingan pengasuh tinggal.\n\nProgram ini menumbuhkan kebiasaan tertib dan tanggung jawab dalam kehidupan sehari-hari.",
                "kategori": "Program",
                "status": "terbit",
                "published_at": wib(2026, 2, 20),
                "publication_consent": True,
                "media_url": "/images/kemandirian.jpg",
                "media_alt": "Latihan kemandirian harian adik binaan",
            },
            {
                "slug": "laporan-pertanggungjawaban-bantuan-donor-maret",
                "judul": "Laporan Penggunaan Bantuan Donor Bulan Maret",
                "ringkasan": "Ringkasan penggunaan bantuan per bulan untuk pos pendidikan, gizi, kesehatan, dan operasional.",
                "isi": "Laporan penggunaan bantuan bulan Maret mencakup pos pendidikan, makanan gizi, kesehatan, dan operasional.\n\nPembagian persentase mengikuti halaman Pengurus Panti: pendidikan 45%, makanan gizi 30%, kesehatan 15%, operasional 10%.\n\nRincian lengkap dapat diminta melalui sekretariat lembaga.",
                "kategori": "Laporan",
                "status": "terbit",
                "published_at": wib(2026, 3, 5),
                "publication_consent": True,
                "media_url": "/images/gizi.jpg",
                "media_alt": "Pemenuhan makanan bergizi anak binaan",
            },
            {
                "slug": "kunjungan-mahasiswa-kkn-tematik",
                "judul": "Kunjungan Mahasiswa KKN Tematik untuk Kelas Belajar",
                "ringkasan": "Mahasiswa KKN mendampingi kelas belajar sore selama dua pekan.",
                "isi": "Mahasiswa KKN tematik mendampingi kelas belajar sore selama dua pekan.\n\nIsi berita draf tidak tampil pada halaman publik sebelum mendapat persetujuan pengurus.",
                "kategori": "Kegiatan",
                "status": "draf",
                "published_at": None,
                "publication_consent": False,
                "media_url": None,
                "media_alt": None,
            },
            {
                "slug": "persiapan-pentas-seni-akhir-tahun",
                "judul": "Persiapan Pentas Seni Akhir Tahun Anak Binaan",
                "ringkasan": "Anak binaan berlatih pentas seni akhir tahun dengan bimbingan pendamping.",
                "isi": "Anak binaan mulai berlatih untuk pentas seni akhir tahun.\n\nPenerbitan menunggu keputusan pengurus sesuai alur persetujuan konten.",
                "kategori": "Kegiatan",
                "status": "draf",
                "published_at": None,
                "publication_consent": False,
                "media_url": None,
                "media_alt": None,
            },
        ]
        for data in articles:
            Article.objects.create(**data)

        for data in [
            {
                "judul": "Jadwal kunjungan donatur diatur lebih dahulu lewat sekretariat",
                "isi": "Kunjungan donatur dan relawan mohon diatur terlebih dahulu melalui sekretariat agar tidak mengganggu jadwal belajar anak.",
                "kategori": "Umum",
                "prioritas": "penting",
                "status": "terbit",
                "published_at": wib(2026, 2, 10),
            },
            {
                "judul": "Penerimaan konfirmasi donasi tetap berjalan pada hari kerja",
                "isi": "Konfirmasi donasi diproses pemeriksaannya pada hari kerja oleh petugas yang berwenang. Waktu verifikasi tidak dijanjikan.",
                "kategori": "Donasi",
                "prioritas": "biasa",
                "status": "terbit",
                "published_at": wib(2026, 3, 1),
            },
            {
                "judul": "Pendataan ulang profil pengasuh",
                "isi": "Pengurus sedang mendata ulang profil pengasuh beserta izin tayang profil.",
                "kategori": "Internal",
                "prioritas": "biasa",
                "status": "draf",
                "published_at": None,
            },
        ]:
            Announcement.objects.create(**data)

        for data in [
            {"nama": "Ibu Sarwati", "peran": "Kepala Pengasuhan", "publication_consent": True, "status": "terbit"},
            {"nama": "Bapak Hendra W.", "peran": "Pengasuh Tinggal", "publication_consent": True, "status": "terbit"},
            {"nama": "Ibu Nur Aini", "peran": "Pendamping Belajar", "publication_consent": True, "status": "terbit"},
            {"nama": "Ibu Dewi Lestari", "peran": "Pendamping Kesehatan", "publication_consent": False, "status": "draf"},
            {"nama": "Bapak Yusuf R.", "peran": "Tata Usaha", "publication_consent": False, "status": "draf"},
        ]:
            Staff.objects.create(**data)

        aula = RentalItem.objects.create(
            nama="Aula Serbaguna",
            jenis="aula",
            satuan="per sesi 8 jam",
            tarif_contoh=500_000,
            tambahan=[
                {"nama": "Sound system", "tarif": 150_000, "wajib": True},
                {"nama": "Kebersihan", "tarif": 50_000, "wajib": True},
            ],
            status="terbit",
        )
        RentalItem.objects.create(
            nama="Kursi Plastik",
            jenis="kursi",
            satuan="per unit per hari",
            tarif_contoh=5_000,
            tambahan=[],
            status="terbit",
        )
        RentalItem.objects.create(
            nama="Tenda Kegiatan",
            jenis="tenda",
            satuan="per unit per hari",
            tarif_contoh=75_000,
            tambahan=[],
            status="terbit",
        )

        AdminUser.objects.create(
            email="admin@paymdanukusumo",
            nama="Admin LKSA Danukusumo",
            role="admin",
            password_hash=make_password("admin123"),
        )

        donasi_1 = DonationConfirmation.objects.create(
            referensi="DON-DEMO-0001",
            idempotency_key="seed-don-1",
            nama="Hamba Allah",
            email="donatur1@contoh.id",
            wa="081200000001",
            nominal_rupiah=500_000,
            keterangan="Bantuan pendidikan",
            receipt_key=tulis_bukti("png"),
            consent_at=wib(2026, 3, 10, 10),
            leaderboard_consent=False,
            status="menunggu-verifikasi",
        )
        donasi_2 = DonationConfirmation.objects.create(
            referensi="DON-DEMO-0002",
            idempotency_key="seed-don-2",
            nama="Alumni Angkatan 2010",
            email="donatur2@contoh.id",
            wa="081200000002",
            nominal_rupiah=1_500_000,
            keterangan="Program makanan gizi",
            receipt_key=tulis_bukti("pdf"),
            consent_at=wib(2026, 3, 8, 10),
            leaderboard_consent=True,
            status="terverifikasi",
            verified_by="Admin LKSA Danukusumo",
            verified_at=wib(2026, 3, 9, 10),
            keputusan_alasan="Bukti dan mutasi rekening sesuai.",
        )
        DonationConfirmation.objects.create(
            referensi="DON-DEMO-0003",
            idempotency_key="seed-don-3",
            nama="Bu Ratna",
            email="donatur3@contoh.id",
            wa="081200000003",
            nominal_rupiah=250_000,
            keterangan="Donasi rutin",
            receipt_key=tulis_bukti("png"),
            consent_at=wib(2026, 3, 7, 10),
            leaderboard_consent=False,
            status="perlu-perbaikan",
            verified_by="Admin LKSA Danukusumo",
            verified_at=wib(2026, 3, 7, 14),
            keputusan_alasan="Bukti tidak terbaca jelas, mohon unggah ulang.",
        )

        snapshot_aula = {
            "jenis": "aula",
            "rincian": [
                {"label": "Aula (1 sesi 8 jam)", "jumlah": 500_000},
                {"label": "Sound system", "jumlah": 150_000},
                {"label": "Kebersihan", "jumlah": 50_000},
            ],
            "total": 700_000,
        }
        sewa_1 = RentalRequest.objects.create(
            referensi="SEW-DEMO-0001",
            idempotency_key="seed-sew-1",
            rental_item_id=aula.id,
            penyewa="Panitia Pengajian Kelurahan",
            kontak="081300000001",
            alamat="Jl. Melati No. 1, Purworejo",
            jadwal={"mulai": "2026-04-10", "selesai": "2026-04-10"},
            rincian_jenis={"kegiatan": "Pengajian rutin", "peserta": 40, "jamMulai": "08.00", "jamSelesai": "16.00", "jumlahSesi": 1},
            estimasi_snapshot=snapshot_aula,
            status="diajukan",
        )
        sewa_2 = RentalRequest.objects.create(
            referensi="SEW-DEMO-0002",
            idempotency_key="seed-sew-2",
            rental_item_id=aula.id,
            penyewa="Komunitas Belajar Anak",
            kontak="081300000002",
            alamat="Jl. Melati No. 2, Purworejo",
            jadwal={"mulai": "2026-04-12", "selesai": "2026-04-12"},
            rincian_jenis={"kegiatan": "Kelas belajar bersama", "peserta": 25, "jamMulai": "08.00", "jamSelesai": "16.00", "jumlahSesi": 1},
            estimasi_snapshot=snapshot_aula,
            status="ditinjau",
        )
        RentalRequest.objects.create(
            referensi="SEW-DEMO-0003",
            idempotency_key="seed-sew-3",
            rental_item_id=aula.id,
            penyewa="Keluarga Warganegara",
            kontak="081300000003",
            alamat="Jl. Melati No. 3, Purworejo",
            jadwal={"mulai": "2026-03-20", "selesai": "2026-03-20"},
            rincian_jenis={"kegiatan": "Walimah", "peserta": 80, "jamMulai": "08.00", "jamSelesai": "16.00", "jumlahSesi": 1},
            estimasi_snapshot=snapshot_aula,
            status="disetujui",
            keputusan_alasan="Jadwal tidak bertabrakan, pengurus menyetujui.",
        )

        for actor, aksi, entity_type, entity_id, perubahan in [
            (None, "seed", "InstitutionStats", str(stats.id), None),
            (None, "seed", "DonationConfirmation", str(donasi_1.id), "menunggu-verifikasi"),
            (None, "seed", "RentalRequest", str(sewa_1.id), "diajukan"),
            (None, "seed", "RentalRequest", str(sewa_2.id), "ditinjau"),
            (None, "seed", "Article", str(Article.objects.first().id), None),
        ]:
            AuditEvent.objects.create(
                actor_id=actor,
                aksi=aksi,
                entity_type=entity_type,
                entity_id=entity_id,
                perubahan_status=perubahan,
            )

        for jenis, entitas, entity_id, referensi in [
            ("donasi", "DonationConfirmation", donasi_1.id, "DON-DEMO-0001"),
            ("persewaan", "RentalRequest", sewa_1.id, "SEW-DEMO-0001"),
            ("persewaan", "RentalRequest", sewa_2.id, "SEW-DEMO-0002"),
        ]:
            notif = Notification.objects.create(
                jenis=jenis,
                entity_type=entitas,
                entity_id=str(entity_id),
                referensi=referensi,
            )
            NotificationDelivery.objects.create(
                notification_id=notif.id,
                kanal="dashboard",
                penerima="dashboard",
                status="terkirim",
                percobaan=1,
                sent_at=timezone.now(),
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Seed selesai: "
                f"{Article.objects.count()} berita, "
                f"{Announcement.objects.count()} pengumuman, "
                f"{Staff.objects.count()} pengasuh, "
                f"{RentalItem.objects.count()} item sewa, "
                f"{DonationConfirmation.objects.count()} donasi, "
                f"{RentalRequest.objects.count()} permohonan."
            )
        )
