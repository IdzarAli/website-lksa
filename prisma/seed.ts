/**
 * Seed data sintetis (SEMUA BERLABEL CONTOH) sesuai spesifikasi §8.
 * Tidak ada data nyata: nama, nomor WA, email, bukti transfer = fiktif.
 * Jalankan: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

// Direktori bukti transfer DI LUAR folder publik (INV-4)
const RECEIPTS_DIR = join(process.cwd(), "storage", "receipts");

// PNG 1x1 putih & PDF minimal valid — bukti transfer TIRUAN berlabel CONTOH
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
const TINY_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 90 >>
stream
BT /F1 14 Tf 40 120 Td (CONTOH - Bukti transfer tiruan untuk prototipe) Tj ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF`,
  "utf8"
);

function tulisBukti(ext: "png" | "pdf"): string {
  mkdirSync(RECEIPTS_DIR, { recursive: true });
  // nama acak heksadesimal — format sama dengan simpanBukti (src/lib/upload.ts)
  const key = `${randomBytes(24).toString("hex")}.${ext}`;
  writeFileSync(join(RECEIPTS_DIR, key), ext === "png" ? TINY_PNG : TINY_PDF);
  return key;
}

async function main() {
  console.log("Mulai seed (data CONTOH)…");

  // ---- bersihkan (urutan aman) ----
  await db.notificationDelivery.deleteMany();
  await db.notification.deleteMany();
  await db.auditEvent.deleteMany();
  await db.donationConfirmation.deleteMany();
  await db.rentalRequest.deleteMany();
  await db.rentalItem.deleteMany();
  await db.article.deleteMany();
  await db.announcement.deleteMany();
  await db.institutionStats.deleteMany();
  await db.staff.deleteMany();
  await db.adminUser.deleteMany();

  // ---- Statistik agregat (OD-01: angka berbeda per halaman, JANGAN diseragamkan) ----
  // pendidikan 34+56+45+15 = 150 ; alokasi 45+30+15+10 = 100%
  const usiaAgregat = {
    ringkasBeranda: {
      nilai: "35+",
      sumber: "Data internal lama (belum diperbarui)",
      periode: "CONTOH",
    },
    ringkasDonasi: {
      nilai: "150+",
      sumber: "Data internal (belum diverifikasi pengurus)",
      periode: "CONTOH",
    },
    rincian: [
      { label: "0–6 tahun", jumlah: 10 },
      { label: "7–12 tahun", jumlah: 34 },
      { label: "13–15 tahun", jumlah: 56 },
      { label: "16–18 tahun", jumlah: 45 },
      { label: "19 tahun ke atas", jumlah: 5 },
    ],
  };
  const pendidikanAgregat = {
    total: 150,
    rincian: [
      { label: "PAUD–SD/MI", jumlah: 34 },
      { label: "SMP/MTs", jumlah: 56 },
      { label: "SMA/SMK/MA", jumlah: 45 },
      { label: "Perguruan tinggi", jumlah: 15 },
    ],
  };
  const alokasi = {
    rincian: [
      { label: "Pendidikan", persen: 45 },
      { label: "Makanan gizi", persen: 30 },
      { label: "Kesehatan", persen: 15 },
      { label: "Operasional", persen: 10 },
    ],
  };
  await db.institutionStats.create({
    data: {
      periode: "CONTOH (Tahun Ajaran 2025/2026)",
      usiaAgregat: JSON.stringify(usiaAgregat),
      pendidikanAgregat: JSON.stringify(pendidikanAgregat),
      alokasi: JSON.stringify(alokasi),
      sumber: "CONTOH — data sintetis untuk prototipe; menunggu data resmi dari pengurus",
      approvedBy: null,
    },
  });

  // ---- Berita (status campuran; hanya "terbit" tampil publik) ----
  const articles = [
    {
      slug: "pembagian-perlengkapan-sekolah-awal-tahun",
      judul: "Pembagian Perlengkapan Sekolah Awal Tahun Ajaran",
      ringkasan:
        "Kegiatan pembagian perlengkapan sekolah untuk anak binaan menjelang tahun ajaran baru. Data dan foto pada berita ini masih CONTOH.",
      isi: [
        "Kegiatan pembagian perlengkapan sekolah dilaksanakan untuk anak binaan jenjang PAUD hingga SMA. Rincian kegiatan berikut masih **CONTOH** dan menunggu penyuntingan oleh pengurus.",
        "Perlengkapan meliputi buku tulis, seragam, tas, dan alat tulis. Pendanaan berasal dari alokasi pendidikan sebagaimana tercantum pada halaman Dashboard Informasi & Data Panti.",
        "Dokumentasi foto asli kegiatan masih menunggu kiriman dari pengurus sehingga halaman ini memakai placeholder foto.",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "terbit",
      publishedAt: new Date("2026-01-12T09:00:00+07:00"),
      publicationConsent: false,
    },
    {
      slug: "kelas-mengaji-ramadhan-berjalan-reguler",
      judul: "Kelas Mengaji Ramadhan Berjalan Reguler Setiap Pekan",
      ringkasan:
        "Kelas mengaji dan tahsin berlangsung reguler. Seluruh angka dan nama pada berita ini CONTOH.",
      isi: [
        "Kelas mengaji berlangsung setiap pekan dengan pembagian kelompok usia. Rincian jadwal pada berita ini masih **CONTOH**.",
        "Pengasuh pendamping berasal dari tim pengasuhan lembaga. Profil pengasuh hanya ditampilkan pada halaman Dashboard Informasi & Data Panti dengan persetujuan masing-masing.",
        "Berita ini adalah contoh konten untuk menguji tampilan daftar dan halaman detail.",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "terbit",
      publishedAt: new Date("2026-02-03T09:00:00+07:00"),
      publicationConsent: false,
    },
    {
      slug: "pelatihan-mandi-cuci-jadwal-beres-untuk-adik-binaan",
      judul: "Pelatihan Mandi, Cuci, dan Jadwal Beres untuk Adik Binaan",
      ringkasan:
        "Program kemandirian harian untuk adik binaan usia sekolah dasar. Konten CONTOH untuk prototipe.",
      isi: [
        "Program kemandirian harian mencakup latihan mandi, mencuci pakaian sendiri, dan menjaga jadwal beres kamar. Narasi berikut masih **CONTOH**.",
        "Kegiatan dilaporkan berjalan bertahap dengan pendampingan pengasuh tinggal.",
        "Laporan kegiatan asli akan ditulis ulang oleh editor setelah data dari pengurus tersedia.",
      ].join("\n\n"),
      kategori: "Program",
      status: "terbit",
      publishedAt: new Date("2026-02-20T09:00:00+07:00"),
      publicationConsent: false,
    },
    {
      slug: "laporan-pertanggungjawaban-bantuan-donor-maret",
      judul: "Laporan Penggunaan Bantuan Donor Bulan Maret",
      ringkasan:
        "Ringkasan penggunaan bantuan per bulan. Angka pada laporan ini CONTOH dan belum diverifikasi.",
      isi: [
        "Laporan penggunaan bantuan bulan Maret mencakup pos pendidikan, makanan gizi, kesehatan, dan operasional. Angka berikut **CONTOH** dan belum merupakan laporan resmi.",
        "Pembagian persentase mengikuti halaman Dashboard Informasi & Data Panti: pendidikan 45%, makanan gizi 30%, kesehatan 15%, operasional 10%.",
        "Laporan resmi yang terverifikasi akan diterbitkan terpisah oleh pengurus.",
      ].join("\n\n"),
      kategori: "Laporan",
      status: "terbit",
      publishedAt: new Date("2026-03-05T09:00:00+07:00"),
      publicationConsent: false,
    },
    {
      slug: "kunjungan-mahasiswa-kkn-tematik",
      judul: "Kunjungan Mahasiswa KKN Tematik untuk Kelas Belajar",
      ringkasan:
        "Mahasiswa KKN mendampingi kelas belajar sore selama dua pekan. Berita CONTOH berstatus draf.",
      isi: [
        "Mahasiswa KKN tematik mendampingi kelas belajar sore selama dua pekan. Berita ini masih **DRAF** dan belum terbit.",
        "Isi berita draf tidak tampil pada halaman publik sebelum mendapat persetujuan pengurus (INV-6).",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "draf",
      publishedAt: null,
      publicationConsent: false,
    },
    {
      slug: "persiapan-pentas-seni-akhir-tahun",
      judul: "Persiapan Pentas Seni Akhir Tahun Anak Binaan",
      ringkasan:
        "Anak binaan berlatih pentas seni akhir tahun. Berita CONTOH menunggu persetujuan pengurus.",
      isi: [
        "Anak binaan mulai berlatih untuk pentas seni akhir tahun. Berita ini berstatus **menunggu-persetujuan** dan belum tampil di publik.",
        "Penerbitan menunggu keputusan pengurus sesuai alur persetujuan konten (INV-6).",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "menunggu-persetujuan",
      publishedAt: null,
      publicationConsent: false,
    },
  ];
  for (const a of articles) {
    await db.article.create({ data: a });
  }

  // ---- Pengumuman ----
  await db.announcement.createMany({
    data: [
      {
        judul: "Jadwal kunjungan donatur diatur lebih dahulu lewat sekretariat",
        isi: "Kunjungan donatur dan relawan mohon diatur terlebih dahulu melalui sekretariat agar tidak mengganggu jadwal belajar anak. (Konten CONTOH)",
        kategori: "Umum",
        prioritas: "penting",
        status: "terbit",
        publishedAt: new Date("2026-02-10T09:00:00+07:00"),
      },
      {
        judul: "Penerimaan konfirmasi donasi tetap berjalan pada hari kerja",
        isi: "Konfirmasi donasi diproses pemeriksaannya pada hari kerja oleh petugas yang berwenang. Waktu verifikasi tidak dijanjikan. (Konten CONTOH)",
        kategori: "Donasi",
        prioritas: "biasa",
        status: "terbit",
        publishedAt: new Date("2026-03-01T09:00:00+07:00"),
      },
      {
        judul: "Pendataan ulang profil pengasuh",
        isi: "Pengurus sedang mendata ulang profil pengasuh beserta izin tayang profil. (Konten CONTOH, berstatus draf)",
        kategori: "Internal",
        prioritas: "biasa",
        status: "draf",
        publishedAt: null,
      },
    ],
  });

  // ---- Pengasuh (yang tampil publik hanya terbit + consent) ----
  await db.staff.createMany({
    data: [
      { nama: "Ibu Sarwati (CONTOH)", peran: "Kepala Pengasuhan", publicationConsent: true, status: "terbit" },
      { nama: "Bapak Hendra W. (CONTOH)", peran: "Pengasuh Tinggal", publicationConsent: true, status: "terbit" },
      { nama: "Ibu Nur Aini (CONTOH)", peran: "Pendamping Belajar", publicationConsent: true, status: "terbit" },
      { nama: "Ibu Dewi Lestari (CONTOH)", peran: "Pendamping Kesehatan", publicationConsent: false, status: "draf" },
      { nama: "Bapak Yusuf R. (CONTOH)", peran: "Tata Usaha", publicationConsent: false, status: "draf" },
    ],
  });

  // ---- Katalog sewa (tarif CONTOH, OD-05) ----
  const itemAula = await db.rentalItem.create({
    data: {
      nama: "Aula Serbaguna (CONTOH)",
      jenis: "aula",
      satuan: "per sesi 8 jam",
      tarifContoh: 500000,
      tambahan: JSON.stringify([
        { nama: "Sound system", tarif: 150000, wajib: true },
        { nama: "Kebersihan", tarif: 50000, wajib: true },
      ]),
      status: "terbit",
    },
  });
  await db.rentalItem.create({
    data: {
      nama: "Kursi Plastik (CONTOH)",
      jenis: "kursi",
      satuan: "per unit per hari",
      tarifContoh: 5000,
      tambahan: JSON.stringify([]),
      status: "terbit",
    },
  });
  await db.rentalItem.create({
    data: {
      nama: "Tenda Kegiatan (CONTOH)",
      jenis: "tenda",
      satuan: "per unit per hari",
      tarifContoh: 75000,
      tambahan: JSON.stringify([]),
      status: "terbit",
    },
  });

  // ---- Akun admin demo sintetis (WAJIB GANTI SEBELUM PRODUKSI) ----
  await db.adminUser.createMany({
    data: [
      { email: "editor@contoh.id", nama: "Editor Contoh", role: "editor", passwordHash: hashPassword("editor123") },
      { email: "verifikator@contoh.id", nama: "Verifikator Contoh", role: "verifikator", passwordHash: hashPassword("verifikator123") },
      { email: "pengelola@contoh.id", nama: "Pengelola Contoh", role: "pengelola", passwordHash: hashPassword("pengelola123") },
    ],
  });

  // ---- Pengajuan donasi sintetis ----
  const verifikator = await db.adminUser.findUnique({ where: { email: "verifikator@contoh.id" } });

  const d1 = await db.donationConfirmation.create({
    data: {
      referensi: "DON-CONTOH-0001",
      idempotencyKey: "seed-don-1",
      nama: "Hamba Allah (CONTOH)",
      email: "donatur1@contoh.id",
      wa: "081200000001",
      nominalRupiah: 500000,
      keterangan: "Bantuan pendidikan",
      receiptKey: tulisBukti("png"),
      consentAt: new Date("2026-03-10T10:00:00+07:00"),
      leaderboardConsent: false,
      status: "menunggu-verifikasi",
    },
  });
  const d2 = await db.donationConfirmation.create({
    data: {
      referensi: "DON-CONTOH-0002",
      idempotencyKey: "seed-don-2",
      nama: "Alumni Angkatan 2010 (CONTOH)",
      email: "donatur2@contoh.id",
      wa: "081200000002",
      nominalRupiah: 1500000,
      keterangan: "Program makanan gizi",
      receiptKey: tulisBukti("pdf"),
      consentAt: new Date("2026-03-08T10:00:00+07:00"),
      leaderboardConsent: true,
      status: "terverifikasi",
      verifiedBy: verifikator?.nama ?? "Verifikator Contoh",
      verifiedAt: new Date("2026-03-09T10:00:00+07:00"),
      keputusanAlasan: "Bukti dan mutasi rekening sesuai (CONTOH).",
    },
  });
  await db.donationConfirmation.create({
    data: {
      referensi: "DON-CONTOH-0003",
      idempotencyKey: "seed-don-3",
      nama: "Bu Ratna (CONTOH)",
      email: "donatur3@contoh.id",
      wa: "081200000003",
      nominalRupiah: 250000,
      keterangan: "Donasi rutin",
      receiptKey: tulisBukti("png"),
      consentAt: new Date("2026-03-07T10:00:00+07:00"),
      leaderboardConsent: false,
      status: "perlu-perbaikan",
      verifiedBy: verifikator?.nama ?? "Verifikator Contoh",
      verifiedAt: new Date("2026-03-07T14:00:00+07:00"),
      keputusanAlasan: "Bukti tidak terbaca jelas, mohon unggah ulang (CONTOH).",
    },
  });

  // ---- Permohonan sewa sintetis ----
  const r1 = await db.rentalRequest.create({
    data: {
      referensi: "SEW-CONTOH-0001",
      idempotencyKey: "seed-sew-1",
      rentalItemId: itemAula.id,
      penyewa: "Panitia Pengajian Kelurahan (CONTOH)",
      kontak: "081300000001",
      alamat: "Jl. Contoh No. 1, Purworejo",
      jadwal: JSON.stringify({ mulai: "2026-04-10", selesai: "2026-04-10" }),
      rincianJenis: JSON.stringify({ kegiatan: "Pengajian rutin", peserta: 40, jamMulai: "08.00", jamSelesai: "16.00", jumlahSesi: 1 }),
      estimasiSnapshot: JSON.stringify({
        jenis: "aula",
        rincian: [
          { label: "Aula (1 sesi 8 jam)", jumlah: 500000 },
          { label: "Sound system", jumlah: 150000 },
          { label: "Kebersihan", jumlah: 50000 },
        ],
        total: 700000,
      }),
      status: "diajukan",
    },
  });
  const r2 = await db.rentalRequest.create({
    data: {
      referensi: "SEW-CONTOH-0002",
      idempotencyKey: "seed-sew-2",
      rentalItemId: itemAula.id,
      penyewa: "Komunitas Belajar Anak (CONTOH)",
      kontak: "081300000002",
      alamat: "Jl. Contoh No. 2, Purworejo",
      jadwal: JSON.stringify({ mulai: "2026-04-12", selesai: "2026-04-12" }),
      rincianJenis: JSON.stringify({ kegiatan: "Kelas belajar bersama", peserta: 25, jamMulai: "08.00", jamSelesai: "16.00", jumlahSesi: 1 }),
      estimasiSnapshot: JSON.stringify({
        jenis: "aula",
        rincian: [
          { label: "Aula (1 sesi 8 jam)", jumlah: 500000 },
          { label: "Sound system", jumlah: 150000 },
          { label: "Kebersihan", jumlah: 50000 },
        ],
        total: 700000,
      }),
      status: "ditinjau",
    },
  });
  await db.rentalRequest.create({
    data: {
      referensi: "SEW-CONTOH-0003",
      idempotencyKey: "seed-sew-3",
      rentalItemId: itemAula.id,
      penyewa: "Kel. Warganegara (CONTOH)",
      kontak: "081300000003",
      alamat: "Jl. Contoh No. 3, Purworejo",
      jadwal: JSON.stringify({ mulai: "2026-03-20", selesai: "2026-03-20" }),
      rincianJenis: JSON.stringify({ kegiatan: "Walimah", peserta: 80, jamMulai: "08.00", jamSelesai: "16.00", jumlahSesi: 1 }),
      estimasiSnapshot: JSON.stringify({
        jenis: "aula",
        rincian: [
          { label: "Aula (1 sesi 8 jam)", jumlah: 500000 },
          { label: "Sound system", jumlah: 150000 },
          { label: "Kebersihan", jumlah: 50000 },
        ],
        total: 700000,
      }),
      status: "disetujui",
      keputusanAlasan: "Jadwal tidak bertabrakan, pengurus menyetujui (CONTOH).",
    },
  });

  // ---- Audit untuk keputusan berseed ----
  await db.auditEvent.createMany({
    data: [
      { actorId: null, aksi: "seed", entityType: "DonationConfirmation", entityId: d1.id, perubahanStatus: "menunggu-verifikasi" },
      { actorId: verifikator?.id ?? null, aksi: "ubah-status", entityType: "DonationConfirmation", entityId: d2.id, perubahanStatus: "terverifikasi" },
      { actorId: null, aksi: "seed", entityType: "RentalRequest", entityId: r1.id, perubahanStatus: "diajukan" },
      { actorId: null, aksi: "seed", entityType: "RentalRequest", entityId: r2.id, perubahanStatus: "ditinjau" },
    ],
  });

  // ---- Notifikasi dasbor untuk pengajuan yang belum selesai ----
  for (const [jenis, entityId, referensi] of [
    ["donasi", d1.id, "DON-CONTOH-0001"],
    ["persewaan", r1.id, "SEW-CONTOH-0001"],
    ["persewaan", r2.id, "SEW-CONTOH-0002"],
  ] as const) {
    const notif = await db.notification.create({
      data: { jenis, entityType: jenis === "donasi" ? "DonationConfirmation" : "RentalRequest", entityId, referensi },
    });
    await db.notificationDelivery.create({
      data: { notificationId: notif.id, kanal: "dashboard", penerima: "dashboard", status: "terkirim", percobaan: 1, sentAt: new Date() },
    });
  }

  const counts = {
    articles: await db.article.count(),
    announcements: await db.announcement.count(),
    staff: await db.staff.count(),
    rentalItems: await db.rentalItem.count(),
    donations: await db.donationConfirmation.count(),
    rentals: await db.rentalRequest.count(),
    admins: await db.adminUser.count(),
  };
  console.log("Selesai seed:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
