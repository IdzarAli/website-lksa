import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";

/**
 * GET /api/articles/{slug}  (PRD-016)
 * Hanya berita berstatus "terbit"; selain itu 404 → UI "Berita tidak ditemukan".
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return amankan(async () => {
    const { slug } = await params;
    const slugAman = (slug ?? "").slice(0, 200);
    if (!/^[a-z0-9-]+$/.test(slugAman)) {
      return jsonGagal(404, "Berita tidak ditemukan");
    }
    const artikel = await db.article.findUnique({ where: { slug: slugAman } });
    if (!artikel || artikel.status !== "terbit") {
      return jsonGagal(404, "Berita tidak ditemukan");
    }
    return jsonOk({ item: artikel });
  });
}
