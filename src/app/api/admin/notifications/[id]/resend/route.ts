import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { kirimUlangDelivery } from "@/lib/notify";

/** POST /api/admin/notifications/[id]/resend — kirim ulang pesan gagal (percobaan dibatasi). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["verifikator", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const { id } = await params;

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const deliveryId = typeof body.deliveryId === "string" ? body.deliveryId : "";
    if (!deliveryId) return jsonGagal(400, "deliveryId wajib diisi");

    const notifikasi = await db.notification.findUnique({ where: { id } });
    if (!notifikasi) return jsonGagal(404, "Notifikasi tidak ditemukan");

    const templateId = notifikasi.jenis === "donasi" ? "terima-pengajuan-donasi" : "terima-pengajuan-sewa";
    const hasil = await kirimUlangDelivery(db, deliveryId, templateId, notifikasi.referensi);
    return jsonOk(hasil, { status: hasil.ok ? 200 : 409 });
  });
}
