"""Penyimpanan bukti transfer privat (INV-4).

Berkas disimpan di backend/storage/receipts (di luar static/public) dengan nama
acak. Hanya endpoint berperan verifikator/pengelola yang dapat membacanya.
"""
from __future__ import annotations

import re
import secrets
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

EKSTENSI_DIIZINKAN = {"jpg", "jpeg", "png", "pdf"}
MIME_DIIZINKAN = {"image/jpeg", "image/png", "application/pdf"}
MAKS_UKURAN = 5 * 1024 * 1024
RE_RECEIPT_KEY = re.compile(r"^[a-f0-9]{16,64}\.[a-z0-9]{2,5}$", re.IGNORECASE)


def direktori_bukti() -> Path:
    return Path(settings.RECEIPTS_DIR)


def path_bukti(receipt_key: str) -> Path:
    if not RE_RECEIPT_KEY.match(receipt_key):
        raise ValueError("receiptKey tidak sah")
    return direktori_bukti() / receipt_key


def _signature_cocok(data: bytes, ext: str, mime: str) -> bool:
    if len(data) < 8:
        return False
    if mime == "image/jpeg":
        if ext not in {"jpg", "jpeg"}:
            return False
        return data[0:3] == b"\xff\xd8\xff"
    if mime == "image/png":
        if ext != "png":
            return False
        return data[0:8] == b"\x89PNG\r\n\x1a\n"
    if mime == "application/pdf":
        if ext != "pdf":
            return False
        return data[0:5] == b"%PDF-"
    return False


def _scan_file(data: bytes, nama: str) -> tuple[bool, str | None]:
    if data[0:2] in {b"MZ", b"\x7fE"}:
        return False, "executable-ditolak"
    if data[0:2] == b"#!":
        return False, "script-ditolak"
    if re.search(r"\.(exe|bat|cmd|sh|js|php)$", nama, re.IGNORECASE):
        return False, "ekstensi-berbahaya"
    return True, None


def validasi_berkas_bukti(berkas: UploadedFile | None) -> tuple[bytes | None, str | None, str | None]:
    """Kembalikan (buffer, ext, pesan_galat)."""
    if berkas is None:
        return None, None, "Bukti transfer wajib diunggah"
    if berkas.size == 0:
        return None, None, "Berkas kosong"
    if berkas.size > MAKS_UKURAN:
        return None, None, "Ukuran berkas melebihi 5 MB"

    nama = berkas.name or ""
    ext = nama.rsplit(".", 1)[-1].lower() if "." in nama else ""
    mime = (berkas.content_type or "").lower()
    if ext not in EKSTENSI_DIIZINKAN or mime not in MIME_DIIZINKAN:
        return None, None, "Tipe berkas harus JPG, PNG, atau PDF"

    data = berkas.read()
    if not data:
        return None, None, "Berkas kosong"
    if not _signature_cocok(data, ext, mime):
        return None, None, "Isi berkas tidak sesuai format yang diklaim"
    aman, alasan = _scan_file(data, nama)
    if not aman:
        return None, None, alasan or "Berkas ditolak oleh pemeriksaan keamanan"
    return data, ext, None


def simpan_bukti(data: bytes, ext: str) -> str:
    direktori_bukti().mkdir(parents=True, exist_ok=True)
    ext_aman = re.sub(r"[^a-z0-9]", "", ext.lower())[:5] or "bin"
    receipt_key = f"{secrets.token_hex(24)}.{ext_aman}"
    (direktori_bukti() / receipt_key).write_bytes(data)
    return receipt_key


def baca_bukti(receipt_key: str) -> tuple[bytes, str] | None:
    try:
        path = path_bukti(receipt_key)
        data = path.read_bytes()
    except (ValueError, OSError):
        return None
    ext = path.suffix.lower().lstrip(".")
    mime = "image/png" if ext == "png" else "application/pdf" if ext == "pdf" else "image/jpeg"
    return data, mime


def hapus_bukti(receipt_key: str) -> None:
    try:
        path_bukti(receipt_key).unlink(missing_ok=True)
    except (ValueError, OSError):
        pass
