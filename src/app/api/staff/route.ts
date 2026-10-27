import { db } from "@/lib/db";
import { amankan, jsonOk } from "@/lib/api";

/**
 * GET /api/staff — direktori pengasuh (PRD-013).
 * Hanya pengasuh berstatus "terbit" DAN publicationConsent=true
 * (izin tayang per orang; OD-07). Tanpa data pribadi lain.
 */
export async function GET() {
  return amankan(async () => {
    const items = await db.staff.findMany({
      where: { status: "terbit", publicationConsent: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, peran: true, foto: true },
    });
    return jsonOk({ items });
  });
}
