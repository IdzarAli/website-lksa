"""Endpoint publik (tanpa autentikasi)."""
from __future__ import annotations

import re
from datetime import datetime

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpRequest
from django.utils import timezone

from .auth import api_view
from .models import (
    Announcement,
    Article,
    AuditEvent,
    DonationConfirmation,
    InstitutionStats,
    RentalItem,
    RentalRequest,
    Staff,
)
from .notify import kirim_notifikasi_pengajuan
from .pricing import (
    KesalahanEstimasi,
    hitung_estimasi,
    jumlah_hari_inklusif,
    parse_nominal_rupiah,
)
from .ratelimit import cek_batas_laju, ip_dari_request
from .responses import baca_json, json_gagal, json_ok
from .serializers import (
    article_lengkap,
    article_ringkas,
    rental_item,
    staff_public,
    stats_public,
)
from .services import buat_referensi
from .storage import hapus_bukti, simpan_bukti, validasi_berkas_bukti
from .validation import (
    bersihkan_teks,
    validasi_email,
    validasi_tanggal_iso,
    validasi_wajib,
    validasi_wa,
)

UKURAN_HALAMAN = 6


@api_view(["GET"])
def articles_list(request: HttpRequest):
    q = (request.GET.get("q") or "").strip()[:100]
    tahun_mentah = (request.GET.get("year") or "").strip()
    tahun = int(tahun_mentah) if re.fullmatch(r"\d{4}", tahun_mentah) else None
    try:
        halaman = max(1, min(1000, int(request.GET.get("page", "1"))))
    except ValueError:
        halaman = 1

    queryset = Article.objects.filter(status="terbit")
    if q:
        queryset = queryset.filter(
            Q(judul__icontains=q) | Q(ringkasan__icontains=q) | Q(isi__icontains=q)
        )
    if tahun:
        mulai = timezone.make_aware(datetime(tahun, 1, 1), timezone.get_current_timezone())
        selesai = timezone.make_aware(datetime(tahun + 1, 1, 1), timezone.get_current_timezone())
        queryset = queryset.filter(published_at__gte=mulai, published_at__lt=selesai)

    queryset = queryset.order_by("-published_at", "-created_at")
    total = queryset.count()
    offset = (halaman - 1) * UKURAN_HALAMAN
    items = [article_ringkas(a) for a in queryset[offset : offset + UKURAN_HALAMAN]]

    tahun_tersedia = sorted(
        {
            timezone.localtime(a.published_at).year
            for a in Article.objects.filter(status="terbit", published_at__isnull=False).only(
                "published_at"
            )
            if a.published_at
        },
        reverse=True,
    )

    return json_ok(
        {
            "items": items,
            "total": total,
            "page": halaman,
            "pageSize": UKURAN_HALAMAN,
            "totalPages": max(1, (total + UKURAN_HALAMAN - 1) // UKURAN_HALAMAN),
            "years": [str(y) for y in tahun_tersedia],
        }
    )


@api_view(["GET"])
def article_detail(request: HttpRequest, slug: str):
    slug_aman = (slug or "")[:200]
    if not re.fullmatch(r"[a-z0-9-]+", slug_aman):
        return json_gagal(404, "Berita tidak ditemukan")
    artikel = Article.objects.filter(slug=slug_aman, status="terbit").first()
    if artikel is None:
        return json_gagal(404, "Berita tidak ditemukan")
    return json_ok({"item": article_lengkap(artikel)})


@api_view(["GET"])
def announcements_list(_request: HttpRequest):
    items = Announcement.objects.filter(status="terbit").order_by(
        "-published_at", "-created_at"
    )[:10]
    return json_ok(
        {
            "items": [
                {
                    "id": str(item.id),
                    "judul": item.judul,
                    "isi": item.isi,
                    "kategori": item.kategori,
                    "prioritas": item.prioritas,
                    "publishedAt": item.published_at,
                }
                for item in items
            ]
        }
    )


@api_view(["GET"])
def institution_stats(_request: HttpRequest):
    terbaru = InstitutionStats.objects.order_by("-created_at").first()
    return json_ok({"item": stats_public(terbaru) if terbaru else None})


@api_view(["GET"])
def staff_list(_request: HttpRequest):
    items = Staff.objects.filter(status="terbit", publication_consent=True).order_by("nama")
    return json_ok({"items": [staff_public(item) for item in items]})


@api_view(["GET"])
def rental_items(_request: HttpRequest):
    items = RentalItem.objects.filter(status="terbit").order_by("nama")
    return json_ok({"items": [rental_item(item) for item in items]})


@api_view(["POST"], skip_csrf=True)
def donation_create(request: HttpRequest):
    if not cek_batas_laju(f"donasi:{ip_dari_request(request)}", 10, 60):
        return json_gagal(429, "Terlalu sering. Coba lagi beberapa saat lagi.")

    idempotency_key = (request.headers.get("Idempotency-Key") or "").strip()
    if not (8 <= len(idempotency_key) <= 100):
        return json_gagal(
            400,
            "Header Idempotency-Key wajib ada",
            {"errors": {"umum": "Header Idempotency-Key wajib ada"}},
        )

    sudah = DonationConfirmation.objects.filter(idempotency_key=idempotency_key).first()
    if sudah:
        return json_ok(
            {"referensi": sudah.referensi, "status": sudah.status, "duplikat": True}
        )

    nama = bersihkan_teks(request.POST.get("nama"))
    email = bersihkan_teks(request.POST.get("email"))
    wa = bersihkan_teks(request.POST.get("wa"))
    nominal_mentah = bersihkan_teks(request.POST.get("nominal"))
    keterangan = bersihkan_teks(request.POST.get("keterangan"))
    persetujuan = request.POST.get("persetujuanVerifikasi")
    leaderboard = request.POST.get("leaderboardConsent")
    berkas = request.FILES.get("bukti")

    errors: dict[str, str] = {}
    for kunci, pesan in (
        ("nama", validasi_wajib(nama, "Nama", 2, 120)),
        ("email", validasi_email(email)),
        ("wa", validasi_wa(wa)),
        ("keterangan", validasi_wajib(keterangan, "Keterangan", 0, 500)),
    ):
        if pesan:
            errors[kunci] = pesan

    nominal = parse_nominal_rupiah(nominal_mentah)
    if nominal is None:
        errors["nominal"] = (
            "Nominal harus bilangan rupiah tanpa pecahan, lebih dari nol (contoh: Rp500.000)"
        )
    if persetujuan != "true":
        errors["persetujuan"] = "Persetujuan verifikasi wajib dicentang"

    data_berkas, ext, galat_berkas = validasi_berkas_bukti(berkas)
    if galat_berkas:
        errors["bukti"] = galat_berkas

    if errors:
        return json_gagal(400, "Periksa kembali isian formulir", {"errors": errors})

    # Guard: validasi sebelumnya menjamin ketiga nilai ini terisi.
    if data_berkas is None or ext is None or nominal is None:
        return json_gagal(500, "Kesalahan validasi internal")
    receipt_key = simpan_bukti(data_berkas, ext)
    referensi = buat_referensi("DON")

    try:
        with transaction.atomic():
            konfirmasi = DonationConfirmation.objects.create(
                referensi=referensi,
                idempotency_key=idempotency_key,
                nama=nama,
                email=email,
                wa=re.sub(r"[\s\-().]", "", wa),
                nominal_rupiah=nominal,
                keterangan=keterangan or None,
                receipt_key=receipt_key,
                consent_at=timezone.now(),
                leaderboard_consent=leaderboard == "true",
                status="menunggu-verifikasi",
            )
            AuditEvent.objects.create(
                actor_id=None,
                aksi="pengajuan-donasi",
                entity_type="DonationConfirmation",
                entity_id=str(konfirmasi.id),
                perubahan_status="menunggu-verifikasi",
            )
            kirim_notifikasi_pengajuan(
                jenis="donasi",
                entity_type="DonationConfirmation",
                entity_id=str(konfirmasi.id),
                referensi=referensi,
                template_id="terima-pengajuan-donasi",
                penerima_wa=wa,
                penerima_email=email,
            )
    except IntegrityError:
        hapus_bukti(receipt_key)
        ada = DonationConfirmation.objects.filter(idempotency_key=idempotency_key).first()
        if ada:
            return json_ok(
                {"referensi": ada.referensi, "status": ada.status, "duplikat": True}
            )
        raise
    except Exception:
        hapus_bukti(receipt_key)
        raise

    return json_ok({"referensi": referensi, "status": "menunggu-verifikasi"}, status=201)


@api_view(["POST"], skip_csrf=True)
def rental_create(request: HttpRequest):
    if not cek_batas_laju(f"sewa:{ip_dari_request(request)}", 10, 60):
        return json_gagal(429, "Terlalu sering. Coba lagi beberapa saat lagi.")

    idempotency_key = (request.headers.get("Idempotency-Key") or "").strip()
    if not (8 <= len(idempotency_key) <= 100):
        return json_gagal(
            400,
            "Header Idempotency-Key wajib ada",
            {"errors": {"umum": "Header Idempotency-Key wajib ada"}},
        )

    sudah = RentalRequest.objects.filter(idempotency_key=idempotency_key).first()
    if sudah:
        return json_ok(
            {"referensi": sudah.referensi, "status": sudah.status, "duplikat": True}
        )

    body = baca_json(request)
    if body is None:
        return json_gagal(400, "Format pengiriman tidak valid")

    jenis = bersihkan_teks(body.get("jenis"))
    if jenis not in {"aula", "kursi", "tenda"}:
        return json_gagal(
            400, "Jenis persewaan tidak dikenal", {"errors": {"jenis": "Pilih jenis persewaan"}}
        )

    item_id = bersihkan_teks(body.get("rentalItemId"))
    item = RentalItem.objects.filter(pk=item_id, status="terbit").first() if item_id else None
    if item is None or item.jenis != jenis:
        return json_gagal(
            400, "Item sewa tidak tersedia", {"errors": {"jenis": "Item sewa tidak tersedia"}}
        )

    penyewa = bersihkan_teks(body.get("penyewa"))
    kontak = bersihkan_teks(body.get("kontak"))
    alamat = bersihkan_teks(body.get("alamat"))
    catatan_tambahan = bersihkan_teks(body.get("tambahan"))
    jadwal = body.get("jadwal") if isinstance(body.get("jadwal"), dict) else {}
    mulai = bersihkan_teks(jadwal.get("mulai"))
    selesai = bersihkan_teks(jadwal.get("selesai"))
    persetujuan = body.get("persetujuanDihubungi")

    errors: dict[str, str] = {}
    pesan = validasi_wajib(penyewa, "Nama penyewa", 2, 120)
    if pesan:
        errors["penyewa"] = pesan
    if validasi_wa(kontak) is not None and validasi_email(kontak, "Kontak") is not None:
        errors["kontak"] = "Isi nomor WhatsApp (8–16 digit) atau email yang valid"
    pesan = validasi_wajib(alamat, "Alamat", 5, 300)
    if pesan:
        errors["alamat"] = pesan
    pesan = validasi_tanggal_iso(mulai, "Tanggal mulai")
    if pesan:
        errors["mulai"] = pesan
    pesan = validasi_tanggal_iso(selesai, "Tanggal selesai")
    if pesan:
        errors["selesai"] = pesan
    if persetujuan is not True:
        errors["persetujuan"] = "Persetujuan untuk dihubungi wajib dicentang"

    rincian: dict[str, object] = {}
    if jenis == "aula":
        data_aula = body.get("rincianAula") if isinstance(body.get("rincianAula"), dict) else {}
        kegiatan = bersihkan_teks(data_aula.get("kegiatan"))
        try:
            peserta = int(str(data_aula.get("peserta", "0")))
        except ValueError:
            peserta = 0
        jam_mulai = bersihkan_teks(data_aula.get("jamMulai"))
        jam_selesai = bersihkan_teks(data_aula.get("jamSelesai"))
        pesan = validasi_wajib(kegiatan, "Nama kegiatan", 3, 150)
        if pesan:
            errors["kegiatan"] = pesan
        if peserta <= 0 or peserta > 500:
            errors["peserta"] = "Jumlah peserta harus bilangan bulat 1–500"
        if not re.fullmatch(r"\d{1,2}[.:]\d{2}", jam_mulai) or not re.fullmatch(
            r"\d{1,2}[.:]\d{2}", jam_selesai
        ):
            errors["jam"] = "Jam kegiatan harus diisi (contoh 08.00 s.d. 16.00)"
        rincian = {
            "kegiatan": kegiatan,
            "peserta": peserta,
            "jamMulai": jam_mulai.replace(".", ":"),
            "jamSelesai": jam_selesai.replace(".", ":"),
        }
    else:
        data_unit = body.get("rincianUnit") if isinstance(body.get("rincianUnit"), dict) else {}
        try:
            unit = int(str(data_unit.get("unit", "0")))
        except ValueError:
            unit = 0
        lokasi = bersihkan_teks(data_unit.get("lokasi"))
        if unit <= 0 or unit > 2000:
            errors["unit"] = "Jumlah unit harus bilangan bulat positif"
        pesan = validasi_wajib(lokasi, "Lokasi pemasangan/pemakaian", 3, 150)
        if pesan:
            errors["lokasi"] = pesan
        rincian = {"unit": unit, "lokasi": lokasi}

    if errors:
        return json_gagal(400, "Periksa kembali isian formulir", {"errors": errors})

    hari = jumlah_hari_inklusif(mulai, selesai)
    if hari is None:
        return json_gagal(
            400,
            "Rentang tanggal tidak valid",
            {"errors": {"selesai": "Tanggal selesai tidak boleh sebelum tanggal mulai"}},
        )

    try:
        if jenis == "aula":
            estimasi = hitung_estimasi(
                jenis="aula",
                jumlah_sesi=hari,
                tarif_aula=item.tarif_contoh,
                tambahan_aula=item.tambahan if isinstance(item.tambahan, list) else [],
            )
        else:
            estimasi = hitung_estimasi(
                jenis=jenis,
                jumlah_unit=int(rincian["unit"]),
                jumlah_hari=hari,
                tarif_per_unit_per_hari=item.tarif_contoh,
            )
    except KesalahanEstimasi as exc:
        return json_gagal(400, str(exc), {"errors": {"umum": str(exc)}})

    referensi = buat_referensi("SEW")
    snapshot = {
        **rincian,
        **({"catatanTambahan": catatan_tambahan} if catatan_tambahan else {}),
    }
    estimasi_snapshot = {
        **estimasi,
        "catatan": "Estimasi hitung ulang server; tarif CONTOH; estimasi belum final",
    }

    try:
        with transaction.atomic():
            permohonan = RentalRequest.objects.create(
                referensi=referensi,
                idempotency_key=idempotency_key,
                rental_item_id=item.id,
                penyewa=penyewa,
                kontak=kontak,
                alamat=alamat,
                jadwal={"mulai": mulai, "selesai": selesai},
                rincian_jenis=snapshot,
                estimasi_snapshot=estimasi_snapshot,
                status="diajukan",
            )
            AuditEvent.objects.create(
                actor_id=None,
                aksi="pengajuan-sewa",
                entity_type="RentalRequest",
                entity_id=str(permohonan.id),
                perubahan_status="diajukan",
            )
            kontak_bersih = re.sub(r"[\s\-().]", "", kontak)
            kirim_notifikasi_pengajuan(
                jenis="persewaan",
                entity_type="RentalRequest",
                entity_id=str(permohonan.id),
                referensi=referensi,
                template_id="terima-pengajuan-sewa",
                penerima_wa=kontak if re.fullmatch(r"\+?\d{8,16}", kontak_bersih) else "",
                penerima_email=kontak if "@" in kontak else "",
            )
    except IntegrityError:
        ada = RentalRequest.objects.filter(idempotency_key=idempotency_key).first()
        if ada:
            return json_ok(
                {"referensi": ada.referensi, "status": ada.status, "duplikat": True}
            )
        raise

    return json_ok({"referensi": referensi, "status": "diajukan"}, status=201)
