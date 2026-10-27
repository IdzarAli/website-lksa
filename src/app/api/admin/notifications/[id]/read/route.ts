import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";

/** POST /api/admin/notifications/[id]/read — tandai sudah dibaca. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["verifikator", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const { id } = await params;
    const ada = await db.notification.findUnique({ where: { id } });
    if (!ada) return jsonGagal(404, "Notifikasi tidak ditemukan");
    const diperbarui = await db.notification.update({
      where: { id },
      data: { dibacaOleh: sesi.nama, dibacaAt: new Date() },
    });
    return jsonOk({ id: diperbarui.id, dibaca: true });
  });
}
