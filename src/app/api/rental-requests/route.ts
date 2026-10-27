import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { ambilIdempotencyKey, buatReferensi } from "@/lib/reference";
import { bersihkanTeks, validasiEmail, validasiTanggalISO, validasiWa, validasiWajib } from "@/lib/validation";
import { hitungEstimasi, jumlahHariInklusif, KesalahanEstimasi } from "@/lib/pricing";
import { kirimNotifikasiPengajuan } from "@/lib/notify";
import { cekBatasLaju, ipDariRequest } from "@/lib/ratelimit";

/**
 * POST /api/rental-requests  (PRD-015, INV-2)
 * - JSON; header Idempotency-Key wajib
 * - HANYA PERMOHONAN: tidak mengunci jadwal, tidak meminta pembayaran
 * - Estimasi dihitung ulang DI SERVER (total dari browser TIDAK dipercaya)
 * - Saat jenis berubah/kolom tersembunyi: server hanya membaca kolom milik jenis tsb
 * - Simpan permohonan + AuditEvent + Notification dalam SATU transaksi
 * - Respons minimal: referensi + status "diajukan"
 */
export async function POST(req: NextRequest) {
  return amankan(async () => {
    if (!cekBatasLaju(`sewa:${ipDariRequest(req)}`, 10, 60_000)) {
      return jsonGagal(429, "Terlalu sering. Coba lagi beberapa saat lagi.");
    }

    const idempotencyKey = ambilIdempotencyKey(req);
    if (!idempotencyKey) {
      return jsonGagal(400, "Header Idempotency-Key wajib ada", { errors: { umum: "Header Idempotency-Key wajib ada" } });
    }

    const sudah = await db.rentalRequest.findUnique({ where: { idempotencyKey } });
    if (sudah) {
      return jsonOk({ referensi: sudah.referensi, status: sudah.status, duplikat: true });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return jsonGagal(400, "Format pengiriman tidak valid");
    }

    const jenis = bersihkanTeks(body.jenis); // aula | kursi | tenda
    if (!["aula", "kursi", "tenda"].includes(jenis)) {
      return jsonGagal(400, "Jenis persewaan tidak dikenal", { errors: { jenis: "Pilih jenis persewaan" } });
    }

    // item katalog harus terbit dan jenisnya cocok
    const itemId = bersihkanTeks(body.rentalItemId);
    const item = itemId ? await db.rentalItem.findFirst({ where: { id: itemId, status: "terbit" } }) : null;
    if (!item || item.jenis !== jenis) {
      return jsonGagal(400, "Item sewa tidak tersedia", { errors: { jenis: "Item sewa tidak tersedia" } });
    }

    const penyewa = bersihkanTeks(body.penyewa);
    const kontak = bersihkanTeks(body.kontak);
    const alamat = bersihkanTeks(body.alamat);
    const catatanTambahan = bersihkanTeks(body.tambahan);
    const jadwal = (body.jadwal ?? {}) as Record<string, unknown>;
    const mulai = bersihkanTeks(jadwal.mulai);
    const selesai = bersihkanTeks(jadwal.selesai);
    const persetujuan = body.persetujuanDihubungi;

    const errors: Record<string, string> = {};
    const ePenyewa = validasiWajib(penyewa, "Nama penyewa", 2, 120);
    if (ePenyewa) errors.penyewa = ePenyewa;
    // kontak: boleh WA atau email
    const eKontak = validasiWa(kontak) === null ? null : validasiEmail(kontak, "Kontak");
    if (eKontak) errors.kontak = "Isi nomor WhatsApp (8–16 digit) atau email yang valid";
    const eAlamat = validasiWajib(alamat, "Alamat", 5, 300);
    if (eAlamat) errors.alamat = eAlamat;
    const eMulai = validasiTanggalISO(mulai, "Tanggal mulai");
    if (eMulai) errors.mulai = eMulai;
    const eSelesai = validasiTanggalISO(selesai, "Tanggal selesai");
    if (eSelesai) errors.selesai = eSelesai;
    if (persetujuan !== true) {
      errors.persetujuan = "Persetujuan untuk dihubungi wajib dicentang";
    }

    // rincian sesuai jenis; kolom milik jenis lain DIBIARKAN/DIABAikan server
    const rincian: Record<string, unknown> = {};
    if (jenis === "aula") {
      const kegiatan = bersihkanTeks((body.rincianAula as Record<string, unknown> | undefined)?.kegiatan);
      const peserta = Number.parseInt(String((body.rincianAula as Record<string, unknown> | undefined)?.peserta ?? ""), 10);
      const jamMulai = bersihkanTeks((body.rincianAula as Record<string, unknown> | undefined)?.jamMulai);
      const jamSelesai = bersihkanTeks((body.rincianAula as Record<string, unknown> | undefined)?.jamSelesai);
      const eKeg = validasiWajib(kegiatan, "Nama kegiatan", 3, 150);
      if (eKeg) errors.kegiatan = eKeg;
      if (!Number.isInteger(peserta) || peserta <= 0 || peserta > 500) {
        errors.peserta = "Jumlah peserta harus bilangan bulat 1–500";
      }
      if (!/^\d{1,2}[.:]\d{2}$/.test(jamMulai) || !/^\d{1,2}[.:]\d{2}$/.test(jamSelesai)) {
        errors.jam = "Jam kegiatan harus diisi (contoh 08.00 s.d. 16.00)";
      }
      rincian.kegiatan = kegiatan;
      rincian.peserta = Number.isInteger(peserta) ? peserta : 0;
      rincian.jamMulai = jamMulai.replace(".", ":");
      rincian.jamSelesai = jamSelesai.replace(".", ":");
    } else {
      const unit = Number.parseInt(String((body.rincianUnit as Record<string, unknown> | undefined)?.unit ?? ""), 10);
      const lokasi = bersihkanTeks((body.rincianUnit as Record<string, unknown> | undefined)?.lokasi);
      if (!Number.isInteger(unit) || unit <= 0 || unit > 2000) {
        errors.unit = "Jumlah unit harus bilangan bulat positif";
      }
      const eLok = validasiWajib(lokasi, "Lokasi pemasangan/pemakaian", 3, 150);
      if (eLok) errors.lokasi = eLok;
      rincian.unit = Number.isInteger(unit) ? unit : 0;
      rincian.lokasi = lokasi;
    }

    if (Object.keys(errors).length > 0) {
      return jsonGagal(400, "Periksa kembali isian formulir", { errors });
    }

    // hitung ulang estimasi DI SERVER
    let estimasi;
    try {
      const hari = jumlahHariInklusif(mulai, selesai);
      if (hari === null) {
        return jsonGagal(400, "Rentang tanggal tidak valid", { errors: { selesai: "Tanggal selesai tidak boleh sebelum tanggal mulai" } });
      }
      const tambahanAula = JSON.parse(item.tambahan || "[]") as { nama: string; tarif: number }[];
      estimasi =
        jenis === "aula"
          ? hitungEstimasi({
              jenis: "aula",
              jumlahSesi: hari, // 1 hari = 1 sesi 8 jam
              tarifAula: item.tarifContoh,
              tambahanAula,
            })
          : hitungEstimasi({
              jenis: jenis as "kursi" | "tenda",
              jumlahUnit: rincian.unit as number,
              jumlahHari: hari,
              tarifPerUnitPerHari: item.tarifContoh,
            });
    } catch (e) {
      if (e instanceof KesalahanEstimasi) {
        return jsonGagal(400, e.message, { errors: { umum: e.message } });
      }
      throw e;
    }

    const referensi = buatReferensi("SEW");
    const snapshotRincian = {
      ...rincian,
      ...(catatanTambahan ? { catatanTambahan } : {}),
    };

    try {
      const hasil = await db.$transaction(async (tx) => {
        const permohonan = await tx.rentalRequest.create({
          data: {
            referensi,
            idempotencyKey,
            rentalItemId: item.id,
            penyewa,
            kontak,
            alamat,
            jadwal: JSON.stringify({ mulai, selesai }),
            rincianJenis: JSON.stringify(snapshotRincian),
            estimasiSnapshot: JSON.stringify({
              jenis: estimasi.jenis,
              rincian: estimasi.rincian,
              total: estimasi.total,
              catatan: "Estimasi hitung ulang server; tarif CONTOH; estimasi belum final",
            }),
            status: "diajukan",
          },
        });
        await tx.auditEvent.create({
          data: {
            actorId: null,
            aksi: "pengajuan-sewa",
            entityType: "RentalRequest",
            entityId: permohonan.id,
            perubahanStatus: "diajukan",
          },
        });
        await kirimNotifikasiPengajuan(tx as unknown as typeof db, {
          jenis: "persewaan",
          entityType: "RentalRequest",
          entityId: permohonan.id,
          referensi,
          templateId: "terima-pengajuan-sewa",
          penerimaWa: /^(\+?\d{8,16})$/.test(kontak.replace(/[\s\-().]/g, "")) ? kontak : "",
          penerimaEmail: kontak.includes("@") ? kontak : "",
        });
        return permohonan;
      });

      return jsonOk({ referensi: hasil.referensi, status: hasil.status }, { status: 201 });
    } catch (e) {
      if (e instanceof Error && e.message.includes("idempotencyKey")) {
        const ada = await db.rentalRequest.findUnique({ where: { idempotencyKey } });
        if (ada) return jsonOk({ referensi: ada.referensi, status: ada.status, duplikat: true });
      }
      throw e;
    }
  });
}
