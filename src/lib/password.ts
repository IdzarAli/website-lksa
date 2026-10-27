import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Hash & verifikasi password memakai scrypt (bawaan Node) — tanpa dependensi tambahan.
 * Format tersimpan: scrypt:<saltHex>:<hashHex>
 * CATATAN PROTOTIPE: akun demo sintetis — WAJIB ganti mekanisme & password sebelum produksi.
 */
export function hashPassword(password: string): string {
  const saltHex = randomBytes(16).toString("hex");
  const hash = scryptSync(password, Buffer.from(saltHex, "hex"), 64).toString("hex");
  return `scrypt:${saltHex}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, saltHex, hashHex] = parts;
  try {
    const hash = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    if (hash.length !== expected.length) return false;
    return timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

/** Nama berkas acak untuk bukti transfer (INV-4: tidak boleh mudah ditebak). */
export function randomReceiptKey(ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin";
  return `${randomBytes(24).toString("hex")}.${safeExt}`;
}
