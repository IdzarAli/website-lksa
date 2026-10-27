import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bacaBukti } from "@/lib/upload";

/**
 * GET /api/admin/receipts/[key] — SATU-SATUNYA jalur membaca bukti transfer (INV-4).
 * Bukti tidak pernah ada di folder publik; hanya verifikator/pengelola yang
 * berwenang, dicek DI SERVER pada setiap permintaan.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["verifikator", "pengelola"]);
    if (!sesi || status !== 200) {
      return jsonGagal(status, status === 401 ? "Harus masuk terlebih dahulu" : "Tidak berwenang membuka bukti");
    }

    const { key } = await params;
    const receiptKey = (key ?? "").slice(0, 80);
    // manipulasi ID bukti ditolak (format ketat)
    if (!/^[a-f0-9]{16,64}\.[a-z0-9]{2,5}$/i.test(receiptKey)) {
      return jsonGagal(400, "Identitas bukti tidak sah");
    }

    // pastikan receiptKey milik catatan donasi yang ada (bukan tebakan acak)
    const terpakai = await db.donationConfirmation.findFirst({ where: { receiptKey }, select: { id: true } });
    if (!terpakai) return jsonGagal(404, "Bukti tidak ditemukan");

    const hasil = bacaBukti(receiptKey);
    if (!hasil) return jsonGagal(404, "Bukti tidak ditemukan");

    return new NextResponse(new Uint8Array(hasil.buffer), {
      headers: {
        "Content-Type": hasil.mime,
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
