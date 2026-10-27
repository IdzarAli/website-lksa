import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";

/**
 * GET /api/admin/donations?status= — antrean donasi (verifikator/pengelola).
 * Detail penuh (termasuk bukti) hanya via route terautentikasi.
 */
export async function GET(req: NextRequest) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["verifikator", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const statusFilter = (req.nextUrl.searchParams.get("status") ?? "").trim();
    const items = await db.donationConfirmation.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, referensi: true, nama: true, email: true, wa: true,
        nominalRupiah: true, keterangan: true, receiptKey: true,
        leaderboardConsent: true, status: true, verifiedBy: true,
        verifiedAt: true, keputusanAlasan: true, version: true, createdAt: true,
      },
    });
    return jsonOk({ items });
  });
}
