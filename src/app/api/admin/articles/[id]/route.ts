import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bolehTransisi, TRANSISI_KONTEN } from "@/lib/status";
import { bersihkanTeks } from "@/lib/validation";

/**
 * PATCH /api/admin/articles/[id] — ubah isi/medra/status (editor).
 * Status mengikuti alur persetujuan konten (INV-6):
 * draf → menunggu-persetujuan → terbit | ditarik → draf
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");

    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonGagal(400, "Permintaan tidak valid");
    }

    const artikel = await db.article.findUnique({ where: { id } });
    if (!artikel) return jsonGagal(404, "Berita tidak ditemukan");

    // perubahan status saja
    if (typeof body.status === "string" && Object.keys(body).length === 1) {
      const statusBaru = bersihkanTeks(body.status);
      if (!bolehTransisi(TRANSISI_KONTEN, artikel.status, statusBaru)) {
        return jsonGagal(409, `Perubahan status "${artikel.status}" → "${statusBaru}" tidak diizinkan`);
      }
      const diperbarui = await db.article.update({
        where: { id },
        data: {
          status: statusBaru,
          publishedAt: statusBaru === "terbit" ? (artikel.publishedAt ?? new Date()) : artikel.publishedAt,
        },
      });
      await db.auditEvent.create({
        data: {
          actorId: sesi.uid,
          aksi: "ubah-status-berita",
          entityType: "Article",
          entityId: id,
          perubahanStatus: `${artikel.status} -> ${statusBaru}`,
        },
      });
      return NextResponse.json({ id: diperbarui.id, status: diperbarui.status });
    }

    // perubahan isi
    const judul = bersihkanTeks(body.judul);
    const ringkasan = bersihkanTeks(body.ringkasan);
    const isi = bersihkanTeks(body.isi);
    const kategori = bersihkanTeks(body.kategori);
    const mediaAlt = bersihkanTeks(body.mediaAlt);
    const mediaUrlRaw = bersihkanTeks(body.mediaUrl);
    const mediaUrl = mediaUrlRaw && (/^https:\/\//.test(mediaUrlRaw) || mediaUrlRaw.startsWith("/")) ? mediaUrlRaw.slice(0, 500) : null;
    const consent = body.publicationConsent === true;

    const errors: Record<string, string> = {};
    if (judul && (judul.length < 5 || judul.length > 200)) errors.judul = "Judul 5–200 karakter";
    if (ringkasan && (ringkasan.length < 10 || ringkasan.length > 400)) errors.ringkasan = "Ringkasan 10–400 karakter";
    if (isi && (isi.length < 20 || isi.length > 20000)) errors.isi = "Isi minimal 20 karakter";
    if (mediaUrl && !mediaAlt) errors.mediaAlt = "Foto memerlukan teks alternatif";
    if (Object.keys(errors).length) return jsonGagal(400, "Periksa isian", { errors });

    const diperbarui = await db.article.update({
      where: { id },
      data: {
        ...(judul ? { judul } : {}),
        ...(ringkasan ? { ringkasan } : {}),
        ...(isi ? { isi } : {}),
        ...(kategori ? { kategori } : {}),
        mediaUrl,
        mediaAlt: mediaAlt || null,
        publicationConsent: consent,
        // perubahan isi mengembalikan ke draf agar melewati persetujuan ulang (INV-6)
        status: "draf",
      },
    });
    await db.auditEvent.create({
      data: { actorId: sesi.uid, aksi: "sunting-berita", entityType: "Article", entityId: id, perubahanStatus: `${artikel.status} -> draf` },
    });
    return jsonOk({ id: diperbarui.id, status: diperbarui.status });
  });
}

/** DELETE /api/admin/articles/[id] — hapus draf (editor). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const { id } = await params;
    const artikel = await db.article.findUnique({ where: { id } });
    if (!artikel) return jsonGagal(404, "Berita tidak ditemukan");
    if (artikel.status === "terbit") {
      return jsonGagal(409, "Berita terbit harus ditarik dulu sebelum dihapus");
    }
    await db.article.delete({ where: { id } });
    await db.auditEvent.create({
      data: { actorId: sesi.uid, aksi: "hapus-berita", entityType: "Article", entityId: id },
    });
    return jsonOk({ ok: true });
  });
}
