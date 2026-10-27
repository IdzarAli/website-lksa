import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bersihkanTeks } from "@/lib/validation";

/** GET /api/admin/staff — semua pengasuh (editor). */
export async function GET() {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const items = await db.staff.findMany({ orderBy: { nama: "asc" } });
    return jsonOk({ items });
  });
}

/** POST /api/admin/staff — tambah pengasuh draf (editor). */
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
    const nama = bersihkanTeks(body.nama);
    const peran = bersihkanTeks(body.peran);
    if (nama.length < 2 || nama.length > 120) return jsonGagal(400, "Nama 2–120 karakter", { errors: { nama: "Nama 2–120 karakter" } });
    if (!peran) return jsonGagal(400, "Peran wajib diisi", { errors: { peran: "Peran wajib diisi" } });
    const item = await db.staff.create({
      data: { nama, peran, publicationConsent: false, status: "draf" },
    });
    await db.auditEvent.create({ data: { actorId: sesi.uid, aksi: "tambah-pengasuh", entityType: "Staff", entityId: item.id } });
    return jsonOk({ id: item.id }, { status: 201 });
  });
}

/** PATCH /api/admin/staff/[id] — ubah consent/status pengasuh (editor). */
export async function PATCH(req: NextRequest) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonGagal(400, "Permintaan tidak valid");
    }
    const id = bersihkanTeks(body.id);
    const item = id ? await db.staff.findUnique({ where: { id } }) : null;
    if (!item) return jsonGagal(404, "Pengasuh tidak ditemukan");

    const diperbarui = await db.staff.update({
      where: { id },
      data: {
        publicationConsent: body.publicationConsent === true,
        ...(body.status === "terbit" ? { status: "terbit" } : body.status === "draf" ? { status: "draf" } : {}),
      },
    });
    await db.auditEvent.create({ data: { actorId: sesi.uid, aksi: "ubah-pengasuh", entityType: "Staff", entityId: id } });
    return NextResponse.json({ id: diperbarui.id, status: diperbarui.status, publicationConsent: diperbarui.publicationConsent });
  });
}
