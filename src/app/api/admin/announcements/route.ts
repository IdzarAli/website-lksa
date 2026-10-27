import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bersihkanTeks } from "@/lib/validation";

/** GET /api/admin/announcements — semua pengumuman (editor). */
export async function GET() {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const items = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk({ items });
  });
}

/** POST /api/admin/announcements — buat pengumuman draf (editor). */
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
    const isi = bersihkanTeks(body.isi);
    const kategori = bersihkanTeks(body.kategori) || "Umum";
    const prioritas = bersihkanTeks(body.prioritas) === "penting" ? "penting" : "biasa";
    if (judul.length < 5 || judul.length > 200) return jsonGagal(400, "Judul 5–200 karakter", { errors: { judul: "Judul 5–200 karakter" } });
    if (isi.length < 5 || isi.length > 2000) return jsonGagal(400, "Isi 5–2000 karakter", { errors: { isi: "Isi 5–2000 karakter" } });
    const item = await db.announcement.create({
      data: { judul, isi, kategori, prioritas, status: "draf" },
    });
    await db.auditEvent.create({
      data: { actorId: sesi.uid, aksi: "buat-pengumuman", entityType: "Announcement", entityId: item.id },
    });
    return jsonOk({ id: item.id, status: item.status }, { status: 201 });
  });
}
