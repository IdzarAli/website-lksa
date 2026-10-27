import { randomBytes } from "crypto";

/** Nomor referensi pengajuan, mis. DON-20260315-7K3F (fiktif, bukan nomor transaksi bank). */
export function buatReferensi(prefix: "DON" | "SEW", tanggal = new Date()): string {
  const y = tanggal.getFullYear();
  const m = String(tanggal.getMonth() + 1).padStart(2, "0");
  const d = String(tanggal.getDate()).padStart(2, "0");
  const acak = randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${y}${m}${d}-${acak}`;
}

/** Kunci idempotensi dari header; wajib ada pada POST pengajuan. */
export function ambilIdempotencyKey(req: Request): string | null {
  const raw = req.headers.get("idempotency-key");
  if (!raw) return null;
  const key = raw.trim();
  if (key.length < 8 || key.length > 100) return null;
  return key;
}
