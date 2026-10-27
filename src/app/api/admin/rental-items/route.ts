import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bersihkanTeks } from "@/lib/validation";

/** GET /api/admin/rental-items — katalog lengkap (editor). */
export async function GET() {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const items = await db.rentalItem.findMany({ orderBy: { nama: "asc" } });
    return jsonOk({ items: items.map((i) => ({ ...i, tambahan: JSON.parse(i.tambahan || "[]") })) });
  });
}

/** PATCH /api/admin/rental-items — ubah tarif CONTOH / status katalog (editor). */
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
    const item = id ? await db.rentalItem.findUnique({ where: { id } }) : null;
    if (!item) return jsonGagal(404, "Item katalog tidak ditemukan");

    const tarif = Number.parseInt(String(body.tarifContoh ?? ""), 10);
    if (!Number.isInteger(tarif) || tarif < 0 || tarif > 100_000_000) {
      return jsonGagal(400, "Tarif harus bilangan bulat 0–100.000.000", { errors: { tarifContoh: "Tarif harus bilangan bulat 0–100.000.000" } });
    }
    const statusBaru = body.status === "terbit" ? "terbit" : body.status === "draf" ? "draf" : item.status;
    const diperbarui = await db.rentalItem.update({
      where: { id },
      data: { tarifContoh: tarif, status: statusBaru },
    });
    await db.auditEvent.create({ data: { actorId: sesi.uid, aksi: "ubah-tarif", entityType: "RentalItem", entityId: id, perubahanStatus: `${item.status} -> ${statusBaru}` } });
    return NextResponse.json({ id: diperbarui.id, tarifContoh: diperbarui.tarifContoh, status: diperbarui.status });
  });
}
