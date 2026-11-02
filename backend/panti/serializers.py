"""Pemetaan model -> payload JSON camelCase."""
from __future__ import annotations

import json
from typing import Any

from .models import (
    Announcement,
    Article,
    DonationConfirmation,
    InstitutionStats,
    Notification,
    NotificationDelivery,
    RentalItem,
    RentalRequest,
    Staff,
)


def article_ringkas(item: Article) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "slug": item.slug,
        "judul": item.judul,
        "ringkasan": item.ringkasan,
        "kategori": item.kategori,
        "mediaUrl": item.media_url,
        "mediaAlt": item.media_alt,
        "publicationConsent": item.publication_consent,
        "publishedAt": item.published_at,
    }


def article_lengkap(item: Article) -> dict[str, Any]:
    return {
        **article_ringkas(item),
        "isi": item.isi,
        "status": item.status,
        "createdAt": item.created_at,
    }


def article_admin(item: Article) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "slug": item.slug,
        "judul": item.judul,
        "kategori": item.kategori,
        "status": item.status,
        "publishedAt": item.published_at,
        "mediaAlt": item.media_alt,
        "mediaUrl": item.media_url,
        "publicationConsent": item.publication_consent,
    }


def announcement_admin(item: Announcement) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "judul": item.judul,
        "isi": item.isi,
        "kategori": item.kategori,
        "prioritas": item.prioritas,
        "status": item.status,
        "publishedAt": item.published_at,
        "createdAt": item.created_at,
        "mediaAlt": item.media_alt,
        "mediaUrl": item.media_url,
    }


def stats_public(item: InstitutionStats) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "periode": item.periode,
        "sumber": item.sumber,
        "usiaAgregat": item.usia_agregat,
        "pendidikanAgregat": item.pendidikan_agregat,
        "alokasi": item.alokasi,
        "approvedBy": item.approved_by,
    }


def stats_admin(item: InstitutionStats) -> dict[str, Any]:
    return {**stats_public(item), "createdAt": item.created_at}


def staff_public(item: Staff) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "nama": item.nama,
        "peran": item.peran,
        "foto": item.foto,
    }


def staff_admin(item: Staff) -> dict[str, Any]:
    return {
        **staff_public(item),
        "publicationConsent": item.publication_consent,
        "status": item.status,
    }


def rental_item(item: RentalItem) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "nama": item.nama,
        "jenis": item.jenis,
        "satuan": item.satuan,
        "tarifContoh": item.tarif_contoh,
        "tambahan": item.tambahan or [],
        "foto": item.foto or "",
        "status": item.status,
    }


def donation_admin(item: DonationConfirmation) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "referensi": item.referensi,
        "nama": item.nama,
        "email": item.email,
        "wa": item.wa,
        "nominalRupiah": item.nominal_rupiah,
        "keterangan": item.keterangan,
        "receiptKey": item.receipt_key,
        "leaderboardConsent": item.leaderboard_consent,
        "status": item.status,
        "verifiedBy": item.verified_by,
        "verifiedAt": item.verified_at,
        "keputusanAlasan": item.keputusan_alasan,
        "version": item.version,
        "createdAt": item.created_at,
    }


def _json_teks(nilai: Any) -> str:
    """Kolom JSON dikirim sebagai teks JSON agar kontrak API lama tetap sama."""
    if isinstance(nilai, str):
        return nilai
    return json.dumps(nilai or {}, ensure_ascii=False, separators=(",", ":"))


def rental_admin(item: RentalRequest, item_katalog: RentalItem | None) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "referensi": item.referensi,
        "rentalItemId": str(item.rental_item_id),
        "penyewa": item.penyewa,
        "kontak": item.kontak,
        "alamat": item.alamat,
        "jadwal": _json_teks(item.jadwal),
        "rincianJenis": _json_teks(item.rincian_jenis),
        "estimasiSnapshot": _json_teks(item.estimasi_snapshot),
        "status": item.status,
        "keputusanAlasan": item.keputusan_alasan,
        "version": item.version,
        "createdAt": item.created_at,
        "itemNama": item_katalog.nama if item_katalog else "(item dihapus)",
        "itemJenis": item_katalog.jenis if item_katalog else "-",
    }


def delivery_ringkas(item: NotificationDelivery) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "kanal": item.kanal,
        "status": item.status,
        "percobaan": item.percobaan,
    }


def notification_admin(
    item: Notification, status_entitas: str | None, deliveries: list[NotificationDelivery]
) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "jenis": item.jenis,
        "referensi": item.referensi,
        "statusEntitas": status_entitas,
        "createdAt": item.created_at,
        "dibaca": item.dibaca_oleh is not None,
        "dibacaAt": item.dibaca_at,
        "deliveries": [delivery_ringkas(d) for d in deliveries],
    }
