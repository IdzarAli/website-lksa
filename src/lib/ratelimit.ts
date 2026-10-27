/**
 * Rate-limit sederhana dalam memori (spesifikasi §10 keamanan: "rate-limit
 * sederhana untuk upload/pengajuan"). Cukup untuk prototipe satu instans.
 */

const buckets = new Map<string, number[]>();

export function cekBatasLaju(key: string, maks: number, jendelaMs: number): boolean {
  const kini = Date.now();
  const daftar = (buckets.get(key) ?? []).filter((t) => kini - t < jendelaMs);
  if (daftar.length >= maks) {
    buckets.set(key, daftar);
    return false;
  }
  daftar.push(kini);
  buckets.set(key, daftar);
  if (buckets.size > 5000) {
    // buang entri lama agar memori tidak tumbuh tanpa batas
    for (const [k, v] of buckets) {
      if (v.every((t) => kini - t >= jendelaMs)) buckets.delete(k);
    }
  }
  return true;
}

export function ipDariRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "lokal";
}
