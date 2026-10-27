import { db } from "@/lib/db";
import { amankan, jsonOk } from "@/lib/api";

/** GET /api/announcements — pengumuman terbit untuk halaman Informasi (PRD-012). */
export async function GET() {
  return amankan(async () => {
    const items = await db.announcement.findMany({
      where: { status: "terbit" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        judul: true,
        isi: true,
        kategori: true,
        prioritas: true,
        publishedAt: true,
      },
    });
    return jsonOk({ items });
  });
}
