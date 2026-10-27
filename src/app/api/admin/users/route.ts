import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bersihkanTeks } from "@/lib/validation";

/** GET /api/admin/users — daftar akun admin (pengelola). */
export async function GET() {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Hanya pengelola yang berwenang");
    const items = await db.adminUser.findMany({
      orderBy: { nama: "asc" },
      select: { id: true, email: true, nama: true, role: true },
    });
    return jsonOk({ items });
  });
}

/** PATCH /api/admin/users — ubah peran akun (HANYA pengelola; verifikator ditolak). */
export async function PATCH(req: NextRequest) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Hanya pengelola yang berwenang");
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonGagal(400, "Permintaan tidak valid");
    }
    const id = bersihkanTeks(body.id);
    const role = bersihkanTeks(body.role);
    if (!["editor", "verifikator", "pengelola"].includes(role)) {
      return jsonGagal(400, "Peran tidak dikenal", { errors: { role: "Peran tidak dikenal" } });
    }
    const user = await db.adminUser.findUnique({ where: { id } });
    if (!user) return jsonGagal(404, "Akun tidak ditemukan");
    if (user.id === sesi.uid && role !== "pengelola") {
      return jsonGagal(409, "Pengelola tidak boleh menurunkan perannya sendiri");
    }
    const diperbarui = await db.adminUser.update({ where: { id }, data: { role } });
    await db.auditEvent.create({
      data: { actorId: sesi.uid, aksi: "ubah-peran", entityType: "AdminUser", entityId: id, perubahanStatus: `${user.role} -> ${role}` },
    });
    return NextResponse.json({ id: diperbarui.id, role: diperbarui.role });
  });
}
