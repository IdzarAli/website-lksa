"""Layanan domain bersama: referensi, slug, dan mesin status."""
from __future__ import annotations

import re
import secrets
import unicodedata
from datetime import datetime

from django.utils import timezone

# Donasi: menunggu-verifikasi -> terverifikasi | perlu-perbaikan | ditolak
TRANSISI_DONASI = {
    "menunggu-verifikasi": {"terverifikasi", "perlu-perbaikan", "ditolak"},
}

# Persewaan: diajukan -> ditinjau -> disetujui | perlu-perbaikan | ditolak
TRANSISI_PERSEWAAN = {
    "diajukan": {"ditinjau"},
    "ditinjau": {"disetujui", "perlu-perbaikan", "ditolak"},
}

# Konten: draf -> terbit -> ditarik -> draf
TRANSISI_KONTEN = {
    "draf": {"terbit"},
    "terbit": {"ditarik"},
    "ditarik": {"draf"},
}


def boleh_transisi(tabel: dict[str, set[str]], dari: str, ke: str) -> bool:
    return ke in tabel.get(dari, set())


def buat_referensi(prefix: str, tanggal: datetime | None = None) -> str:
    """Nomor referensi fiktif, mis. DON-20260315-7K3F (bukan nomor transaksi bank)."""
    sekarang = timezone.localtime(tanggal or timezone.now())
    acak = secrets.token_hex(2).upper()
    return f"{prefix}-{sekarang:%Y%m%d}-{acak}"


def slugify(judul: str) -> str:
    teks = unicodedata.normalize("NFKD", judul)
    teks = teks.encode("ascii", "ignore").decode("ascii").lower()
    teks = re.sub(r"[^a-z0-9\s-]", "", teks)
    teks = re.sub(r"\s+", "-", teks.strip())
    teks = re.sub(r"-+", "-", teks)[:90]
    return teks or f"berita-{int(timezone.now().timestamp())}"
