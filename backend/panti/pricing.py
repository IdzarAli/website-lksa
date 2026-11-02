"""Fungsi murni aturan hitung (port dari src/lib/pricing.ts).

Vektor wajib:
  - Aula : 500.000 + sound 150.000 + kebersihan 50.000 = Rp700.000
  - Kursi: 40 unit x 2 hari x 5.000 = Rp400.000
  - Pindah jenis aula -> kursi/tenda: tambahan aula tidak dihitung.
"""
from __future__ import annotations

import re
from datetime import date
from typing import Any


class KesalahanEstimasi(ValueError):
    pass


def _pastikan_bulat_positif(nilai: int, nama: str) -> None:
    if not isinstance(nilai, int) or isinstance(nilai, bool) or nilai <= 0:
        raise KesalahanEstimasi(f"{nama} harus bilangan bulat positif")
    if nilai > 1_000_000:
        raise KesalahanEstimasi(f"{nama} melebihi batas wajar")


def hitung_estimasi(
    *,
    jenis: str,
    tarif_aula: int = 0,
    jumlah_sesi: int = 0,
    tambahan_aula: list[dict[str, Any]] | None = None,
    jumlah_unit: int = 0,
    jumlah_hari: int = 0,
    tarif_per_unit_per_hari: int = 0,
) -> dict[str, Any]:
    """Hitung estimasi sewa. Hanya membaca masukan milik jenis yang dipilih."""
    if jenis == "aula":
        _pastikan_bulat_positif(jumlah_sesi, "Jumlah sesi")
        _pastikan_bulat_positif(tarif_aula, "Tarif aula")
        rincian = [
            {
                "label": f"Aula ({jumlah_sesi} sesi 8 jam)",
                "jumlah": tarif_aula * jumlah_sesi,
            }
        ]
        for tambahan in tambahan_aula or []:
            tarif = tambahan.get("tarif", 0)
            _pastikan_bulat_positif(tarif, f"Tarif tambahan {tambahan.get('nama', '')}")
            rincian.append(
                {
                    "label": str(tambahan.get("nama", "Tambahan")),
                    "jumlah": tarif * jumlah_sesi,
                }
            )
        return {
            "jenis": "aula",
            "rincian": rincian,
            "total": sum(item["jumlah"] for item in rincian),
        }

    if jenis not in {"kursi", "tenda"}:
        raise KesalahanEstimasi("Jenis persewaan tidak dikenal")

    _pastikan_bulat_positif(jumlah_unit, "Jumlah unit")
    _pastikan_bulat_positif(jumlah_hari, "Jumlah hari")
    _pastikan_bulat_positif(tarif_per_unit_per_hari, "Tarif per unit per hari")
    subtotal = jumlah_unit * jumlah_hari * tarif_per_unit_per_hari
    return {
        "jenis": jenis,
        "rincian": [
            {
                "label": (
                    f"{jumlah_unit} unit × {jumlah_hari} hari × "
                    f"{format_rupiah(tarif_per_unit_per_hari)}"
                ),
                "jumlah": subtotal,
            }
        ],
        "total": subtotal,
    }


def parse_nominal_rupiah(nilai: str) -> int | None:
    """Parse nominal donasi ke integer rupiah; None bila tidak sah."""
    if not isinstance(nilai, str):
        return None
    teks = nilai.strip()
    if not teks or len(teks) > 20:
        return None
    teks = re.sub(r"^rp", "", teks, flags=re.IGNORECASE)
    teks = re.sub(r"\s+", "", teks)
    if not teks or "," in teks:
        return None
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", teks):
        digit = teks.replace(".", "")
    elif re.fullmatch(r"\d+", teks):
        if len(teks) > 1 and teks.startswith("0"):
            return None
        digit = teks
    else:
        return None
    angka = int(digit)
    return angka if angka > 0 else None


def jumlah_hari_inklusif(mulai: str, selesai: str) -> int | None:
    """Jumlah hari inklusif dari rentang ISO YYYY-MM-DD; None bila tidak sah."""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", mulai or ""):
        return None
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", selesai or ""):
        return None
    try:
        awal = date.fromisoformat(mulai)
        akhir = date.fromisoformat(selesai)
    except ValueError:
        return None
    if akhir < awal:
        return None
    return (akhir - awal).days + 1


def format_rupiah(angka: int) -> str:
    if not isinstance(angka, int) or angka < 0:
        return "—"
    return "Rp" + f"{angka:,}".replace(",", ".")
