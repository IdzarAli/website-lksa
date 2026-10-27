import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bersihkanTeks } from "@/lib/validation";

/** GET /api/admin/stats — riwayat statistik (editor). */
export async function GET() {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["editor", "pengelola"]);
    if (!sesi || status !== 200) return jsonGagal(status, status === 401 ? "Harus masuk" : "Tidak berwenang");
    const items = await db.institutionStats.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    return jsonOk({ items });
  });
}

/**
 * POST /api/admin/stats — simpan versi statistik baru (editor).
 * Struktur rincian divalidasi: jumlah & persen harus bilangan bulat ≥ 0;
 * total persen harus tepat 100 (angka grafik = tabel).
 */
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
    const periode = bersihkanTeks(body.periode);
    const sumber = bersihkanTeks(body.sumber);
    if (!periode) return jsonGagal(400, "Periode wajib diisi", { errors: { periode: "Periode wajib diisi" } });
    if (!sumber) return jsonGagal(400, "Sumber data wajib diisi", { errors: { sumber: "Sumber data wajib diisi" } });

    const validasiKelompok = (arr: unknown, key: string, namaPersen = false): { ok: true; nilai: string } | { ok: false; galat: string } => {
      if (!Array.isArray(arr) || arr.length === 0) return { ok: false, galat: `${key} wajib diisi minimal satu baris` };
      let total = 0;
      for (const baris of arr) {
        const b = (baris ?? {}) as Record<string, unknown>;
        const label = bersihkanTeks(b.label);
        const angka = Number.parseInt(String(b[key === "usiaAgregat" ? "jumlah" : key === "pendidikanAgregat" ? "jumlah" : "persen"] ?? ""), 10);
        if (!label) return { ok: false, galat: `${key}: label wajib diisi` };
        if (!Number.isInteger(angka) || angka < 0) return { ok: false, galat: `${key}: angka harus bilangan bulat ≥ 0` };
        total += angka;
      }
      if (namaPersen && total !== 100) return { ok: false, galat: `alokasi: total persen harus tepat 100% (sekarang ${total}%)` };
      return { ok: true, nilai: JSON.stringify(arr) };
    };

    const usia = validasiKelompok(body.usiaAgregat, "usia");
    if (!usia.ok) return jsonGagal(400, usia.galat, { errors: { usiaAgregat: usia.galat } });
    const pendidikan = validasiKelompok(body.pendidikanAgregat, "pendidikan");
    if (!pendidikan.ok) return jsonGagal(400, pendidikan.galat, { errors: { pendidikanAgregat: pendidikan.galat } });
    const alok = validasiKelompok(body.alokasi, "alokasi", true);
    if (!alok.ok) return jsonGagal(400, alok.galat, { errors: { alokasi: alok.galat } });

    const item = await db.institutionStats.create({
      data: {
        periode,
        sumber,
        usiaAgregat: usia.nilai,
        pendidikanAgregat: pendidikan.nilai,
        alokasi: alok.nilai,
        approvedBy: null, // menunggu persetujuan pengurus (tampil tetap berlabel CONTOH)
      },
    });
    await db.auditEvent.create({
      data: { actorId: sesi.uid, aksi: "simpan-statistik", entityType: "InstitutionStats", entityId: item.id },
    });
    return jsonOk({ id: item.id }, { status: 201 });
  });
}

/** PATCH dinonaktifkan: statistik bersifat tambah-versi-baru (riwayat terjaga). */
export async function PATCH() {
  return jsonGagal(405, "Gunakan POST untuk menyimpan versi statistik baru");
}
