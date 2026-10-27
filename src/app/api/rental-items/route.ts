import { db } from "@/lib/db";
import { amankan, jsonOk } from "@/lib/api";

/** GET /api/rental-items — katalog sewa terbit (PRD-015). Tarif = CONTOH (OD-05). */
export async function GET() {
  return amankan(async () => {
    const items = await db.rentalItem.findMany({
      where: { status: "terbit" },
      orderBy: { nama: "asc" },
    });
    return jsonOk({
      items: items.map((it) => ({ ...it, tambahan: JSON.parse(it.tambahan || "[]") })),
    });
  });
}
