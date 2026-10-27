import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal } from "@/lib/api";
import { wajibPeran } from "@/lib/auth";
import { bolehTransisi, TRANSISI_DONASI } from "@/lib/status";
import { bersihkanTeks } from "@/lib/validation";

/**
 * PATCH /api/admin/donations/[id]/status  (spesifikasi §4–§5)
 * - Hanya peran VERIFIKATOR (editor DILARANG memverifikasi donasi)
 * - Status baru harus sesuai mesin status: menunggu-verifikasi →
 *   terverifikasi | perlu-perbaikan | ditolak; transisi lain DITOLAK server
 * - Alasan wajib; cek `version` agar dua petugas tidak saling menimpa
 * - Tercatat di AuditEvent (tanpa PII/bukti)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return amankan(async () => {
    const { sesi, status } = await wajibPeran(["verifikator"]);
    if (!sesi || status !== 200) {
      return jsonGagal(status, status === 401 ? "Harus masuk terlebih dahulu" : "Peran Anda tidak berwenang mengubah status donasi");
    }

    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonGagal(400, "Permintaan tidak valid");
    }
    const statusBaru = bersihkanTeks(body.status);
    const alasan = bersihkanTeks(body.alasan);
    const versi = Number.parseInt(String(body.version ?? ""), 10);

    if (!alasan || alasan.length < 5) {
      return jsonGagal(400, "Alasan keputusan wajib diisi (minimal 5 karakter)", { errors: { alasan: "Alasan keputusan wajib diisi (minimal 5 karakter)" } });
    }
    if (!Number.isInteger(versi)) {
      return jsonGagal(400, "Versi data tidak valid", { errors: { version: "Muat ulang data dan coba lagi" } });
    }

    const donasi = await db.donationConfirmation.findUnique({ where: { id } });
    if (!donasi) return jsonGagal(404, "Data donasi tidak ditemukan");

    if (!bolehTransisi(TRANSISI_DONASI, donasi.status, statusBaru)) {
      return jsonGagal(409, `Perubahan status dari "${donasi.status}" ke "${statusBaru}" tidak diizinkan`);
    }
    if (donasi.version !== versi) {
      // dua petugas bersamaan: yang kedua ditolak (cek versi)
      return jsonGagal(409, "Data sudah diubah petugas lain. Muat ulang data.", { errors: { version: "Data sudah diubah petugas lain. Muat ulang data." } });
    }

    const diperbarui = await db.donationConfirmation.update({
      where: { id, version: versi },
      data: {
        status: statusBaru,
        verifiedBy: sesi.nama,
        verifiedAt: new Date(),
        keputusanAlasan: alasan,
        version: versi + 1,
      },
    });

    await db.auditEvent.create({
      data: {
        actorId: sesi.uid,
        aksi: "ubah-status-donasi",
        entityType: "DonationConfirmation",
        entityId: id,
        perubahanStatus: `${donasi.status} -> ${statusBaru}`,
      },
    });

    return NextResponse.json({
      id: diperbarui.id,
      status: diperbarui.status,
      version: diperbarui.version,
      verifiedBy: diperbarui.verifiedBy,
    });
  });
}
