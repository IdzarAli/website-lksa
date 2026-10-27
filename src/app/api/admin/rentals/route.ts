import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";

/** GET /api/admin/rentals?status= — antrean permohonan sewa (verifikator/pengelola). */
export async function GET(req: NextRequest) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["verifikator", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const statusFilter = (req.nextUrl.searchParams.get("status") ?? "").trim();
    const items = await db.rentalRequest.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const itemIds = [...new Set(items.map((i) => i.rentalItemId))];
    const katalog = await db.rentalItem.findMany({ where: { id: { in: itemIds } }, select: { id: true, nama: true, jenis: true } });
    const peta = new Map(katalog.map((k) => [k.id, k]));
    return jsonOk({
      items: items.map((i) => ({
        ...i,
        itemNama: peta.get(i.rentalItemId)?.nama ?? "(item dihapus)",
        itemJenis: peta.get(i.rentalItemId)?.jenis ?? "-",
      })),
    });
  });
}
