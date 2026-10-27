import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { ambilIdempotencyKey, buatReferensi } from "@/lib/reference";
import { bersihkanTeks, validasiEmail, validasiWa, validasiWajib } from "@/lib/validation";
import { parseNominalRupiah } from "@/lib/pricing";
import { hapusBukti, simpanBukti, validasiBerkasBukti } from "@/lib/upload";
import { kirimNotifikasiPengajuan } from "@/lib/notify";
import { cekBatasLaju, ipDariRequest } from "@/lib/ratelimit";

/**
 * POST /api/donation-confirmations  (PRD-014, INV-1, INV-7)
 * - multipart/form-data; header Idempotency-Key wajib
 * - Server memvalidasi SEMUA: field, consent, berkas (tipe/ukuran/ekstensi/MIME/signature/scan)
 * - Bukti disimpan DI LUAR folder publik dengan nama acak (INV-4)
 * - Simpan konfirmasi + AuditEvent + Notification dalam SATU transaksi
 * - Respons minimal: referensi + status "menunggu-verifikasi" (INV-7)
 */
export async function POST(req: NextRequest) {
  return amankan(async () => {
    // rate limit sederhana per IP
    if (!cekBatasLaju(`donasi:${ipDariRequest(req)}`, 10, 60_000)) {
      return jsonGagal(429, "Terlalu sering. Coba lagi beberapa saat lagi.");
    }

    const idempotencyKey = ambilIdempotencyKey(req);
    if (!idempotencyKey) {
      return jsonGagal(400, "Header Idempotency-Key wajib ada", { errors: { umum: "Header Idempotency-Key wajib ada" } });
    }

    // Idempotensi: kirim ulang dengan kunci sama → satu catatan, balas yang lama
    const sudah = await db.donationConfirmation.findUnique({ where: { idempotencyKey } });
    if (sudah) {
      return jsonOk({ referensi: sudah.referensi, status: sudah.status, duplikat: true });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonGagal(400, "Format pengiriman tidak valid");
    }

    const nama = bersihkanTeks(form.get("nama"));
    const email = bersihkanTeks(form.get("email"));
    const wa = bersihkanTeks(form.get("wa"));
    const nominalMentah = bersihkanTeks(form.get("nominal"));
    const keterangan = bersihkanTeks(form.get("keterangan"));
    const persetujuan = form.get("persetujuanVerifikasi");
    const leaderboard = form.get("leaderboardConsent");

    const errors: Record<string, string> = {};
    const eNama = validasiWajib(nama, "Nama", 2, 120);
    if (eNama) errors.nama = eNama;
    const eEmail = validasiEmail(email);
    if (eEmail) errors.email = eEmail;
    const eWa = validasiWa(wa);
    if (eWa) errors.wa = eWa;
    const eKet = validasiWajib(keterangan, "Keterangan", 0, 500) ?? null;
    if (eKet) errors.keterangan = eKet;

    const nominal = parseNominalRupiah(nominalMentah);
    if (nominal === null) {
      errors.nominal = "Nominal harus bilangan rupiah tanpa pecahan, lebih dari nol (contoh: Rp500.000)";
    }
    if (persetujuan !== "true") {
      errors.persetujuan = "Persetujuan verifikasi wajib dicentang";
    }

    const berkas = form.get("bukti");
    const hasilBerkas = await validasiBerkasBukti(berkas instanceof File ? berkas : null);
    if (!hasilBerkas.ok) {
      errors.bukti = hasilBerkas.alasan;
    }

    if (Object.keys(errors).length > 0) {
      return jsonGagal(400, "Periksa kembali isian formulir", { errors });
    }

    // simpan berkas dulu; bila transaksi DB gagal, berkas dihapus (tidak ada data setengah jadi)
    const receiptKey = simpanBukti(hasilBerkas.ok ? hasilBerkas.buffer : Buffer.alloc(0), (hasilBerkas as { ok: true; ext: string }).ext);
    const referensi = buatReferensi("DON");

    try {
      const hasil = await db.$transaction(async (tx) => {
        const konfirmasi = await tx.donationConfirmation.create({
          data: {
            referensi,
            idempotencyKey,
            nama,
            email,
            wa,
            nominalRupiah: nominal as number,
            keterangan: keterangan || null,
            receiptKey,
            consentAt: new Date(),
            leaderboardConsent: leaderboard === "true",
            status: "menunggu-verifikasi",
          },
        });
        await tx.auditEvent.create({
          data: {
            actorId: null,
            aksi: "pengajuan-donasi",
            entityType: "DonationConfirmation",
            entityId: konfirmasi.id,
            perubahanStatus: "menunggu-verifikasi",
          },
        });
        await kirimNotifikasiPengajuan(tx as unknown as typeof db, {
          jenis: "donasi",
          entityType: "DonationConfirmation",
          entityId: konfirmasi.id,
          referensi,
          templateId: "terima-pengajuan-donasi",
          penerimaWa: wa,
          penerimaEmail: email,
        });
        return konfirmasi;
      });

      // INV-7: respons minimal & netral
      return jsonOk({ referensi: hasil.referensi, status: hasil.status }, { status: 201 });
    } catch (e) {
      hapusBukti(receiptKey);
      if (e instanceof Error && e.message.includes("idempotencyKey")) {
        const ada = await db.donationConfirmation.findUnique({ where: { idempotencyKey } });
        if (ada) return jsonOk({ referensi: ada.referensi, status: ada.status, duplikat: true });
      }
      throw e;
    }
  });
}
