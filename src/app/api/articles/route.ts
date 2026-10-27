import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonOk } from "@/lib/api";

/**
 * GET /api/articles?q=&year=&page=  (PRD-012)
 * Hanya artikel berstatus "terbit" (INV-6). Kueri + filter tahun publikasi bisa digabung.
 * Tahun ditafsirkan dalam zona WIB (UTC+7) — cocok dengan lokasi lembaga.
 * Proyeksi publik: tanpa isi penuh.
 */
export async function GET(req: NextRequest) {
  return amankan(async () => {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim().slice(0, 100);
    const tahunStr = (sp.get("year") ?? "").trim();
    const tahun = /^\d{4}$/.test(tahunStr) ? Number.parseInt(tahunStr, 10) : null;
    const halaman = Math.max(1, Math.min(1000, Number.parseInt(sp.get("page") ?? "1", 10) || 1));
    const ukuran = 6;

    const where = {
      status: "terbit" as const,
      ...(q ? { OR: [
        { judul: { contains: q } },
        { ringkasan: { contains: q } },
        { isi: { contains: q } },
      ] } : {}),
      ...(tahun ? {
        publishedAt: {
          gte: new Date(`${tahun}-01-01T00:00:00+07:00`),
          lt: new Date(`${tahun + 1}-01-01T00:00:00+07:00`),
        },
      } : {}),
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

    // Daftar tahun publikasi yang tersedia (unik, urut menurun)
    const semuaTerbit = await db.article.findMany({
      where: { status: "terbit", publishedAt: { not: null } },
      select: { publishedAt: true },
    });
    const tahunTersedia = [...new Set(
      semuaTerbit
        .map((a) => a.publishedAt as Date)
        .map((d) => new Date(d.getTime() + 7 * 60 * 60 * 1000).getUTCFullYear()),
    )].sort((a, b) => b - a);

    return jsonOk({
      items,
      total,
      page: halaman,
      pageSize: ukuran,
      totalPages: Math.max(1, Math.ceil(total / ukuran)),
      years: tahunTersedia.map(String),
    });
  });
}
