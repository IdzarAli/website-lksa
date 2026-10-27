import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";

/**
 * GET /api/admin/notifications?jenis=&status=&unread=1  (spesifikasi §4)
 * Daftar "perlu ditinjau" + penanda belum dibaca + filter.
 * TIDAK menampilkan bukti atau data pribadi berlebih (hanya referensi & status ringkas).
 */
export async function GET(req: NextRequest) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["verifikator", "pengelola"]);
    if (!sesi || status !== 200) return jsonOk({ items: [], akses: false, status });

    const sp = req.nextUrl.searchParams;
    const jenis = (sp.get("jenis") ?? "").trim();
    const statusFilter = (sp.get("status") ?? "").trim();
    const hanyaBelum = sp.get("unread") === "1";

    const notifikasi = await db.notification.findMany({
      where: {
        ...(jenis ? { jenis } : {}),
        ...(hanyaBelum ? { dibacaOleh: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // gabungkan status ringkas dari entitas terkait (tanpa PII)
    const items = await Promise.all(
      notifikasi.map(async (n) => {
        let statusEntitas: string | null = null;
        if (n.entityType === "DonationConfirmation") {
          const d = await db.donationConfirmation.findUnique({ where: { id: n.entityId }, select: { status: true } });
          statusEntitas = d?.status ?? null;
        } else if (n.entityType === "RentalRequest") {
          const r = await db.rentalRequest.findUnique({ where: { id: n.entityId }, select: { status: true } });
          statusEntitas = r?.status ?? null;
        }
        const deliveries = await db.notificationDelivery.findMany({
          where: { notificationId: n.id },
          select: { id: true, kanal: true, status: true, percobaan: true },
        });
        return {
          id: n.id,
          jenis: n.jenis,
          referensi: n.referensi,
          statusEntitas,
          createdAt: n.createdAt,
          dibaca: n.dibacaOleh !== null,
          dibacaAt: n.dibacaAt,
          deliveries,
        };
      })
    );

    return jsonOk({
      items: statusFilter ? items.filter((i) => i.statusEntitas === statusFilter) : items,
    });
  });
}
