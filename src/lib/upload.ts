import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { siteConfig } from "@/config/site";

/**
 * Penyimpanan bukti transfer (INV-4):
 * - DI LUAR folder publik → storage/receipts/ (bukan public/)
 * - nama berkas acak (receiptKey), tidak bisa ditebak
 * - hanya dibaca lewat route terautentikasi berperan verifikator/pengelola
 */
const RECEIPTS_DIR = join(process.cwd(), "storage", "receipts");

export function pathBukti(receiptKey: string): string {
  // receiptKey sudah divalidasi ketat — cegah path traversal
  if (!/^[a-f0-9]{16,64}\.[a-z0-9]{2,5}$/i.test(receiptKey)) {
    throw new Error("receiptKey tidak sah");
  }
  return join(RECEIPTS_DIR, receiptKey);
}

export interface BerkasSah {
  ok: true;
  buffer: Buffer;
  ext: string;
  mime: string;
}

export interface BerkasDitolak {
  ok: false;
  alasan: string;
}

/** Validasi berkas bukti: ekstensi, MIME, signature (magic bytes), ukuran ≤ 5 MB. */
export async function validasiBerkasBukti(file: File | null): Promise<BerkasSah | BerkasDitolak> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, alasan: "Bukti transfer wajib diunggah" };
  }
  if (file.size > siteConfig.upload.maxUkuranBytes) {
    return { ok: false, alasan: "Ukuran berkas melebihi 5 MB" };
  }
  const nama = file.name ?? "";
  const ext = (nama.split(".").pop() ?? "").toLowerCase();
  if (!siteConfig.upload.ekstensiDiizinkan.includes(ext)) {
    return { ok: false, alasan: "Tipe berkas harus JPG, PNG, atau PDF" };
  }
  const mime = file.type ?? "";
  if (!siteConfig.upload.tipeDiizinkan.includes(mime)) {
    return { ok: false, alasan: "Tipe berkas harus JPG, PNG, atau PDF" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return { ok: false, alasan: "Berkas kosong" };
  }
  if (!signatureCocok(buffer, ext, mime)) {
    return { ok: false, alasan: "Isi berkas tidak sesuai format yang diklaim" };
  }
  const hasilScan = scanFile(buffer, nama);
  if (!hasilScan.ok) {
    return { ok: false, alasan: hasilScan.alasan ?? "Berkas ditolak oleh pemeriksaan keamanan" };
  }
  return { ok: true, buffer, ext, mime };
}

function signatureCocok(buffer: Buffer, ext: string, mime: string): boolean {
  if (buffer.length < 8) return false;
  // Jenis HARUS konsisten antara MIME, ekstensi, dan isi berkas (cek MIME palsu).
  // MIME → jenis yang diharapkan:
  let jenisDariMime: "jpeg" | "png" | "pdf" | null = null;
  if (mime === "image/jpeg") jenisDariMime = "jpeg";
  else if (mime === "image/png") jenisDariMime = "png";
  else if (mime === "application/pdf") jenisDariMime = "pdf";
  if (jenisDariMime === null) return false;
  // ekstensi harus cocok dengan jenis dari MIME
  const extDariJenis: Record<string, string[]> = { jpeg: ["jpg", "jpeg"], png: ["png"], pdf: ["pdf"] };
  if (!extDariJenis[jenisDariMime].includes(ext)) return false;
  // signature (magic bytes) harus cocok dengan jenis
  if (jenisDariMime === "jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (jenisDariMime === "png") {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return buffer.subarray(0, 8).equals(pngHeader);
  }
  // pdf
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

/**
 * STUB pemindaian malware — placeholder untuk layanan antivirus produksi.
 * Menolak berkas yang jelas mencurigakan (executable/script) sebagai pengaman dasar.
 * TODO(produksi): sambungkan ke pemindai antivirus sungguhan (mis. ClamAV) sebelum go-live.
 */
export function scanFile(buffer: Buffer, nama: string): { ok: boolean; alasan?: string } {
  const kepala = buffer.subarray(0, 4);
  if (kepala[0] === 0x4d && kepala[1] === 0x5a) return { ok: false, alasan: "executable-ditolak" };
  if (kepala[0] === 0x7f && kepala[1] === 0x45 && kepala[2] === 0x4c && kepala[3] === 0x46) {
    return { ok: false, alasan: "executable-ditolak" };
  }
  const asci = buffer.subarray(0, 2).toString("ascii");
  if (asci === "#!" ) return { ok: false, alasan: "script-ditolak" };
  if (/\.(exe|bat|cmd|sh|js|php)$/i.test(nama)) return { ok: false, alasan: "ekstensi-berbahaya" };
  return { ok: true };
}

/** Simpan bukti ke folder privat dengan nama acak. Mengembalikan receiptKey. */
export function simpanBukti(buffer: Buffer, ext: string): string {
  mkdirSync(RECEIPTS_DIR, { recursive: true });
  const extAman = ext.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin";
  const receiptKey = `${randomBytes(24).toString("hex")}.${extAman}`;
  writeFileSync(join(RECEIPTS_DIR, receiptKey), buffer);
  return receiptKey;
}

/** Baca bukti (dipakai route terautentikasi verifikator). */
export function bacaBukti(receiptKey: string): { buffer: Buffer; mime: string } | null {
  try {
    const p = pathBukti(receiptKey);
    const buffer = readFileSync(p);
    const ext = receiptKey.split(".").pop()?.toLowerCase() ?? "";
    const mime =
      ext === "png" ? "image/png" : ext === "pdf" ? "application/pdf" : "image/jpeg";
    return { buffer, mime };
  } catch {
    return null;
  }
}

/** Hapus bukti (dipakai saat transaksi penyimpanan gagal agar tak ada berkas yatim). */
export function hapusBukti(receiptKey: string): void {
  try {
    unlinkSync(pathBukti(receiptKey));
  } catch {
    // diamkan: berkas memang mungkin belum ada
  }
}
