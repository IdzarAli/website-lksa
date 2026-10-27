import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonOk } from "@/lib/api";

/**
 * GET /api/articles?q=&category=&page=  (PRD-012)
 * Hanya artikel berstatus "terbit" (INV-6). Kueri + kategori bisa digabung.
 * Proyeksi publik: tanpa isi penuh.
 */
export async function GET(req: NextRequest) {
  return amankan(async () => {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim().slice(0, 100);
    const kategori = (sp.get("category") ?? "").trim().slice(0, 60);
    const halaman = Math.max(1, Math.min(1000, Number.parseInt(sp.get("page") ?? "1", 10) || 1));
    const ukuran = 6;

    const where = {
      status: "terbit" as const,
      ...(q ? { OR: [
        { judul: { contains: q } },
        { ringkasan: { contains: q } },
        { isi: { contains: q } },
      ] } : {}),
      ...(kategori ? { kategori } : {}),
    };

    const [items, total] = await Promise.all([
      db.article.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (halaman - 1) * ukuran,
        take: ukuran,
        select: {
          id: true,
          slug: true,
          judul: true,
          ringkasan: true,
          kategori: true,
          mediaUrl: true,
          mediaAlt: true,
          publicationConsent: true,
          publishedAt: true,
        },
      }),
      db.article.count({ where }),
    ]);

    const kategoriTersedia = await db.article.findMany({
      where: { status: "terbit" },
      select: { kategori: true },
      distinct: ["kategori"],
      orderBy: { kategori: "asc" },
    });

    return jsonOk({
      items,
      total,
      page: halaman,
      pageSize: ukuran,
      totalPages: Math.max(1, Math.ceil(total / ukuran)),
      categories: kategoriTersedia.map((k) => k.kategori),
    });
  });
}
