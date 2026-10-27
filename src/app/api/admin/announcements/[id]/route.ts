import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bolehTransisi, TRANSISI_KONTEN } from "@/lib/status";
import { bersihkanTeks } from "@/lib/validation";

/** PATCH /api/admin/announcements/[id] — ubah isi atau status (editor). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const { id } = await params;
    const item = await db.announcement.findUnique({ where: { id } });
    if (!item) return jsonGagal(404, "Pengumuman tidak ditemukan");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonGagal(400, "Permintaan tidak valid");
    }

    if (typeof body.status === "string" && Object.keys(body).length === 1) {
      const statusBaru = bersihkanTeks(body.status);
      if (!bolehTransisi(TRANSISI_KONTEN, item.status, statusBaru)) {
        return jsonGagal(409, `Perubahan status "${item.status}" → "${statusBaru}" tidak diizinkan`);
      }
      const diperbarui = await db.announcement.update({
        where: { id },
        data: {
          status: statusBaru,
          publishedAt: statusBaru === "terbit" ? (item.publishedAt ?? new Date()) : item.publishedAt,
        },
      });
      await db.auditEvent.create({
        data: { actorId: sesi.uid, aksi: "ubah-status-pengumuman", entityType: "Announcement", entityId: id, perubahanStatus: `${item.status} -> ${statusBaru}` },
      });
      return NextResponse.json({ id: diperbarui.id, status: diperbarui.status });
    }

    const judul = bersihkanTeks(body.judul);
    const isi = bersihkanTeks(body.isi);
    const prioritas = bersihkanTeks(body.prioritas) === "penting" ? "penting" : "biasa";
    if (judul && (judul.length < 5 || judul.length > 200)) return jsonGagal(400, "Judul 5–200 karakter", { errors: { judul: "Judul 5–200 karakter" } });
    const diperbarui = await db.announcement.update({
      where: { id },
      data: {
        ...(judul ? { judul } : {}),
        ...(isi ? { isi } : {}),
        prioritas,
        status: "draf",
      },
    });
    return jsonOk({ id: diperbarui.id, status: diperbarui.status });
  });
}

/** DELETE /api/admin/announcements/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const { id } = await params;
    const item = await db.announcement.findUnique({ where: { id } });
    if (!item) return jsonGagal(404, "Pengumuman tidak ditemukan");
    if (item.status === "terbit") return jsonGagal(409, "Tarik dulu sebelum menghapus");
    await db.announcement.delete({ where: { id } });
    await db.auditEvent.create({
      data: { actorId: sesi.uid, aksi: "hapus-pengumuman", entityType: "Announcement", entityId: id },
    });
    return jsonOk({ ok: true });
  });
}
