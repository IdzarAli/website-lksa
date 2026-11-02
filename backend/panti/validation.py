"""Validasi teks sisi server (spesifikasi §7 & §10)."""
from __future__ import annotations

import re

RE_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
RE_WA = re.compile(r"^\+?\d{8,16}$")
RE_TANGGAL = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def teks(nilai: object) -> str:
    return nilai.strip() if isinstance(nilai, str) else ""


def bersihkan_teks(nilai: object) -> str:
    hasil = teks(nilai)
    hasil = re.sub(r"[\u0000-\u0008\u000B\u000C\u000E-\u001F]", "", hasil)
    hasil = re.sub(r"\s{3,}", "  ", hasil)
    return hasil


def validasi_wajib(nilai: object, label: str, minimum: int = 1, maksimum: int = 200) -> str | None:
    isi = teks(nilai)
    if len(isi) < minimum:
        return f"{label} wajib diisi"
    if len(isi) > maksimum:
        return f"{label} maksimal {maksimum} karakter"
    return None


def validasi_opsional(nilai: object, label: str, maksimum: int = 500) -> str | None:
    if len(teks(nilai)) > maksimum:
        return f"{label} maksimal {maksimum} karakter"
    return None


def validasi_email(nilai: object, label: str = "Email") -> str | None:
    isi = teks(nilai)
    if not isi:
        return f"{label} wajib diisi"
    if len(isi) > 120:
        return f"{label} maksimal 120 karakter"
    if not RE_EMAIL.match(isi):
        return f"Format {label.lower()} tidak valid"
    return None


def validasi_wa(nilai: object, label: str = "Nomor WhatsApp") -> str | None:
    isi = re.sub(r"[\s\-().]", "", teks(nilai))
    if not isi:
        return f"{label} wajib diisi"
    if not RE_WA.match(isi):
        return f"{label} hanya boleh berisi 8–16 digit angka"
    return None


def validasi_tanggal_iso(nilai: object, label: str) -> str | None:
    if not RE_TANGGAL.match(teks(nilai)):
        return f"{label} harus berformat tanggal"
    return None
