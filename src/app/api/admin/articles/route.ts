import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bersihkanTeks } from "@/lib/validation";

/** Slug sederhana dari judul (a-z0-9-). */
export function slugify(judul: string): string {
  return judul
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90) || `berita-${Date.now()}`;
}

/** GET /api/admin/articles — semua status (editor). */
export async function GET() {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const items = await db.article.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, judul: true, kategori: true, status: true, publishedAt: true, mediaAlt: true, publicationConsent: true },
    });
    return jsonOk({ items });
  });
}

/** POST /api/admin/articles — buat berita draf (editor). */
export async function POST(req: NextRequest) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonGagal(400, "Permintaan tidak valid");
    }
    const judul = bersihkanTeks(body.judul);
    const ringkasan = bersihkanTeks(body.ringkasan);
    const isi = bersihkanTeks(body.isi);
    const kategori = bersihkanTeks(body.kategori);
    const mediaAlt = bersihkanTeks(body.mediaAlt);
    const consent = body.publicationConsent === true;

    const errors: Record<string, string> = {};
    if (judul.length < 5 || judul.length > 200) errors.judul = "Judul 5–200 karakter";
    if (ringkasan.length < 10 || ringkasan.length > 400) errors.ringkasan = "Ringkasan 10–400 karakter";
    if (isi.length < 20 || isi.length > 20000) errors.isi = "Isi minimal 20 karakter";
    if (!kategori) errors.kategori = "Kategori wajib diisi";
    if (mediaUrlOf(body) && !consent && !mediaAlt) {
      // foto hanya tampil bila ada alt + consent
      errors.mediaAlt = "Foto memerlukan teks alternatif dan izin tayang";
    }
    if (Object.keys(errors).length) return jsonGagal(400, "Periksa isian", { errors });

    // slug unik
    let slug = slugify(judul);
    if (await db.article.findUnique({ where: { slug } })) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const artikel = await db.article.create({
      data: {
        slug,
        judul,
        ringkasan,
        isi,
        kategori,
        mediaUrl: mediaUrlOf(body) || null,
        mediaAlt: mediaAlt || null,
        publicationConsent: consent,
        status: "draf",
      },
    });
    await db.auditEvent.create({
      data: { actorId: sesi.uid, aksi: "buat-berita", entityType: "Article", entityId: artikel.id },
    });
    return jsonOk({ id: artikel.id, slug: artikel.slug, status: artikel.status }, { status: 201 });
  });
}

function mediaUrlOf(body: Record<string, unknown>): string {
  const v = bersihkanTeks(body.mediaUrl);
  if (!v) return "";
  // hanya izinkan jalur internal/https, cegah javascript: dsb.
  if (/^https:\/\//.test(v) || v.startsWith("/")) return v.slice(0, 500);
  return "";
}
