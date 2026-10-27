/**
 * Validasi payload sisi server (batas panjang, tipe, nilai) — spesifikasi §7 & §10 keamanan.
 * Semua fungsi mengembalikan PESAN GALAT (string) atau null bila sah.
 */

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Nomor WA internasional/domestik sederhana: 8–16 digit, boleh diawali + atau 0
const RE_WA = /^\+?\d{8,16}$/;

function teks(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function validasiWajib(v: unknown, label: string, min = 1, maks = 200): string | null {
  const s = teks(v);
  if (s.length < min) return `${label} wajib diisi`;
  if (s.length > maks) return `${label} maksimal ${maks} karakter`;
  return null;
}

export function validasiOpsional(v: unknown, label: string, maks = 500): string | null {
  const s = teks(v);
  if (s.length > maks) return `${label} maksimal ${maks} karakter`;
  return null;
}

export function validasiEmail(v: unknown, label = "Email"): string | null {
  const s = teks(v);
  if (s.length === 0) return `${label} wajib diisi`;
  if (s.length > 120) return `${label} maksimal 120 karakter`;
  if (!RE_EMAIL.test(s)) return `Format ${label.toLowerCase()} tidak valid`;
  return null;
}

export function validasiWa(v: unknown, label = "Nomor WhatsApp"): string | null {
  const s = teks(v).replace(/[\s\-().]/g, "");
  if (s.length === 0) return `${label} wajib diisi`;
  if (!RE_WA.test(s)) return `${label} hanya boleh berisi 8–16 digit angka`;
  return null;
}

export function validasiTanggalISO(v: unknown, label: string): string | null {
  const s = teks(v);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${label} harus berformat tanggal`;
  return null;
}

export function validasiBooleanWajib(v: unknown, label: string): string | null {
  if (v !== true && v !== "true" && v !== "on" && v !== 1) {
    return `${label} wajib disetujui`;
  }
  return null;
}

/** Buang karakter kontrol & normalisasi spasi — mencegah sampah di data. */
export function bersihkanTeks(v: unknown): string {
  return teks(v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s{3,}/g, "  ");
}
