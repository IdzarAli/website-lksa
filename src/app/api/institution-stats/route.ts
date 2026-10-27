import { db } from "@/lib/db";
import { amankan, jsonOk } from "@/lib/api";

/**
 * GET /api/institution-stats — statistik agregat (PRD-013, OD-01).
 * INV-3: hanya data AGREGAT, tanpa nama/identitas individu anak.
 * Angka dengan periode & sumber, berlabel CONTOH.
 */
export async function GET() {
  return amankan(async () => {
    const terbaru = await db.institutionStats.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!terbaru) return jsonOk({ item: null });
    return jsonOk({
      item: {
        id: terbaru.id,
        periode: terbaru.periode,
        sumber: terbaru.sumber,
        usiaAgregat: JSON.parse(terbaru.usiaAgregat || "{}"),
        pendidikanAgregat: JSON.parse(terbaru.pendidikanAgregat || "{}"),
        alokasi: JSON.parse(terbaru.alokasi || "{}"),
        approvedBy: terbaru.approvedBy,
      },
    });
  });
}
