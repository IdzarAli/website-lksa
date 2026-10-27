/**
 * Seed data lembaga untuk pengembangan & demo.
 * Nama, nomor kontak, dan bukti transfer pada data demo bersifat fiktif.
 * Jalankan: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

// Direktori bukti transfer DI LUAR folder publik (privat, hanya petugas berwenang)
const RECEIPTS_DIR = join(process.cwd(), "storage", "receipts");

// PNG 1x1 putih & PDF minimal valid — bukti transfer tiruan untuk demo
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
BT /F1 14 Tf 40 120 Td (Bukti transfer tiruan untuk demo) Tj ET
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
  console.log("Mulai seed…");

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

  // ---- Statistik agregat (konsisten dengan data lembaga: 34 anak binaan) ----
  // usia 1+12+9+9+3 = 34 ; pendidikan 13+9+9+3 = 34 ; alokasi 45+30+15+10 = 100%
  // Rincian per kelompok dapat dikoreksi pengurus lewat Ruang Pengurus → Statistik.
  const usiaAgregat = {
    ringkasBeranda: {
      nilai: "34",
      sumber: "Data internal lembaga",
      periode: "Tahun Ajaran 2025/2026",
    },
    ringkasDonasi: {
      nilai: "34",
      sumber: "Data internal lembaga",
      periode: "Tahun Ajaran 2025/2026",
    },
    rincian: [
      { label: "0–6 tahun", jumlah: 1 },
      { label: "7–12 tahun", jumlah: 12 },
      { label: "13–15 tahun", jumlah: 9 },
      { label: "16–18 tahun", jumlah: 9 },
      { label: "19 tahun ke atas", jumlah: 3 },
    ],
  };
  const pendidikanAgregat = {
    total: 34,
    rincian: [
      { label: "PAUD–SD/MI", jumlah: 13 },
      { label: "SMP/MTs", jumlah: 9 },
      { label: "SMA/SMK/MA", jumlah: 9 },
      { label: "Perguruan tinggi", jumlah: 3 },
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
      periode: "Tahun Ajaran 2025/2026",
      usiaAgregat: JSON.stringify(usiaAgregat),
      pendidikanAgregat: JSON.stringify(pendidikanAgregat),
      alokasi: JSON.stringify(alokasi),
      sumber: "Data internal lembaga",
      approvedBy: null,
    },
  });

  // ---- Berita (status campuran; hanya "terbit" tampil publik) ----
  const articles = [
    {
      slug: "pembagian-perlengkapan-sekolah-awal-tahun",
      judul: "Pembagian Perlengkapan Sekolah Awal Tahun Ajaran",
      ringkasan:
        "Kegiatan pembagian perlengkapan sekolah untuk anak binaan menjelang tahun ajaran baru.",
      isi: [
        "Kegiatan pembagian perlengkapan sekolah dilaksanakan untuk anak binaan jenjang PAUD hingga SMA.",
        "Perlengkapan meliputi buku tulis, seragam, tas, dan alat tulis. Pendanaan berasal dari alokasi pendidikan sebagaimana tercantum pada halaman Pengurus Panti.",
        "Terima kasih kepada seluruh donatur dan relawan yang mendukung kelancaran kegiatan ini.",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "terbit",
      publishedAt: new Date("2025-07-14T09:00:00+07:00"),
      publicationConsent: true,
      mediaUrl: "/images/perlengkapan.jpg",
      mediaAlt: "Pembagian perlengkapan sekolah untuk anak binaan",
    },
    {
      slug: "kelas-mengaji-ramadhan-berjalan-reguler",
      judul: "Kelas Mengaji Ramadhan Berjalan Reguler Setiap Pekan",
      ringkasan:
        "Kelas mengaji dan tahsin berlangsung reguler dengan pembagian kelompok usia.",
      isi: [
        "Kelas mengaji berlangsung setiap pekan dengan pembagian kelompok usia.",
        "Pengasuh pendamping berasal dari tim pengasuhan lembaga. Profil pengasuh hanya ditampilkan pada halaman Pengurus Panti dengan persetujuan masing-masing.",
        "Kegiatan ini rutin dilaksanakan sepanjang tahun dan terbuka bagi seluruh anak binaan.",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "terbit",
      publishedAt: new Date("2025-03-01T09:00:00+07:00"),
      publicationConsent: true,
      mediaUrl: "/images/mengaji.jpg",
      mediaAlt: "Kelas mengaji dengan pembagian kelompok usia",
    },
    {
      slug: "pelatihan-mandi-cuci-jadwal-beres-untuk-adik-binaan",
      judul: "Pelatihan Mandi, Cuci, dan Jadwal Beres untuk Adik Binaan",
      ringkasan:
        "Program kemandirian harian untuk adik binaan usia sekolah dasar.",
      isi: [
        "Program kemandirian harian mencakup latihan mandi, mencuci pakaian sendiri, dan menjaga jadwal beres kamar.",
        "Kegiatan dilaporkan berjalan bertahap dengan pendampingan pengasuh tinggal.",
        "Program ini menumbuhkan kebiasaan tertib dan tanggung jawab dalam kehidupan sehari-hari.",
      ].join("\n\n"),
      kategori: "Program",
      status: "terbit",
      publishedAt: new Date("2026-02-20T09:00:00+07:00"),
      publicationConsent: true,
      mediaUrl: "/images/kemandirian.jpg",
      mediaAlt: "Latihan kemandirian harian adik binaan",
    },
    {
      slug: "laporan-pertanggungjawaban-bantuan-donor-maret",
      judul: "Laporan Penggunaan Bantuan Donor Bulan Maret",
      ringkasan:
        "Ringkasan penggunaan bantuan per bulan untuk pos pendidikan, gizi, kesehatan, dan operasional.",
      isi: [
        "Laporan penggunaan bantuan bulan Maret mencakup pos pendidikan, makanan gizi, kesehatan, dan operasional.",
        "Pembagian persentase mengikuti halaman Pengurus Panti: pendidikan 45%, makanan gizi 30%, kesehatan 15%, operasional 10%.",
        "Rincian lengkap dapat diminta melalui sekretariat lembaga.",
      ].join("\n\n"),
      kategori: "Laporan",
      status: "terbit",
      publishedAt: new Date("2026-03-05T09:00:00+07:00"),
      publicationConsent: true,
      mediaUrl: "/images/gizi.jpg",
      mediaAlt: "Pemenuhan makanan bergizi anak binaan",
    },
    {
      slug: "kunjungan-mahasiswa-kkn-tematik",
      judul: "Kunjungan Mahasiswa KKN Tematik untuk Kelas Belajar",
      ringkasan:
        "Mahasiswa KKN mendampingi kelas belajar sore selama dua pekan.",
      isi: [
        "Mahasiswa KKN tematik mendampingi kelas belajar sore selama dua pekan.",
        "Isi berita draf tidak tampil pada halaman publik sebelum mendapat persetujuan pengurus.",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "draf",
      publishedAt: null,
      publicationConsent: false,
      mediaUrl: null,
      mediaAlt: null,
    },
    {
      slug: "persiapan-pentas-seni-akhir-tahun",
      judul: "Persiapan Pentas Seni Akhir Tahun Anak Binaan",
      ringkasan:
        "Anak binaan berlatih pentas seni akhir tahun dengan bimbingan pendamping.",
      isi: [
        "Anak binaan mulai berlatih untuk pentas seni akhir tahun.",
        "Penerbitan menunggu keputusan pengurus sesuai alur persetujuan konten.",
      ].join("\n\n"),
      kategori: "Kegiatan",
      status: "menunggu-persetujuan",
      publishedAt: null,
      publicationConsent: false,
      mediaUrl: null,
      mediaAlt: null,
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
        isi: "Kunjungan donatur dan relawan mohon diatur terlebih dahulu melalui sekretariat agar tidak mengganggu jadwal belajar anak.",
        kategori: "Umum",
        prioritas: "penting",
        status: "terbit",
        publishedAt: new Date("2026-02-10T09:00:00+07:00"),
      },
      {
        judul: "Penerimaan konfirmasi donasi tetap berjalan pada hari kerja",
        isi: "Konfirmasi donasi diproses pemeriksaannya pada hari kerja oleh petugas yang berwenang. Waktu verifikasi tidak dijanjikan.",
        kategori: "Donasi",
        prioritas: "biasa",
        status: "terbit",
        publishedAt: new Date("2026-03-01T09:00:00+07:00"),
      },
      {
        judul: "Pendataan ulang profil pengasuh",
        isi: "Pengurus sedang mendata ulang profil pengasuh beserta izin tayang profil.",
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
      { nama: "Ibu Sarwati", peran: "Kepala Pengasuhan", publicationConsent: true, status: "terbit" },
      { nama: "Bapak Hendra W.", peran: "Pengasuh Tinggal", publicationConsent: true, status: "terbit" },
      { nama: "Ibu Nur Aini", peran: "Pendamping Belajar", publicationConsent: true, status: "terbit" },
      { nama: "Ibu Dewi Lestari", peran: "Pendamping Kesehatan", publicationConsent: false, status: "draf" },
      { nama: "Bapak Yusuf R.", peran: "Tata Usaha", publicationConsent: false, status: "draf" },
    ],
  });

  // ---- Katalog sewa ----
  const itemAula = await db.rentalItem.create({
    data: {
      nama: "Aula Serbaguna",
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
      nama: "Kursi Plastik",
      jenis: "kursi",
      satuan: "per unit per hari",
      tarifContoh: 5000,
      tambahan: JSON.stringify([]),
      status: "terbit",
    },
  });
  await db.rentalItem.create({
    data: {
      nama: "Tenda Kegiatan",
      jenis: "tenda",
      satuan: "per unit per hari",
      tarifContoh: 75000,
      tambahan: JSON.stringify([]),
      status: "terbit",
    },
  });

  // ---- Akun admin demo ----
  await db.adminUser.createMany({
    data: [
      { email: "editor@danukusumo.or.id", nama: "Editor Lembaga", role: "editor", passwordHash: hashPassword("editor123") },
      { email: "verifikator@danukusumo.or.id", nama: "Verifikator Lembaga", role: "verifikator", passwordHash: hashPassword("verifikator123") },
      { email: "pengelola@danukusumo.or.id", nama: "Pengelola Lembaga", role: "pengelola", passwordHash: hashPassword("pengelola123") },
    ],
  });

  // ---- Pengajuan donasi demo ----
  const verifikator = await db.adminUser.findUnique({ where: { email: "verifikator@danukusumo.or.id" } });

  const d1 = await db.donationConfirmation.create({
    data: {
      referensi: "DON-DEMO-0001",
      idempotencyKey: "seed-don-1",
      nama: "Hamba Allah",
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
      referensi: "DON-DEMO-0002",
      idempotencyKey: "seed-don-2",
      nama: "Alumni Angkatan 2010",
      email: "donatur2@contoh.id",
      wa: "081200000002",
      nominalRupiah: 1500000,
      keterangan: "Program makanan gizi",
      receiptKey: tulisBukti("pdf"),
      consentAt: new Date("2026-03-08T10:00:00+07:00"),
      leaderboardConsent: true,
      status: "terverifikasi",
      verifiedBy: verifikator?.nama ?? "Verifikator Lembaga",
      verifiedAt: new Date("2026-03-09T10:00:00+07:00"),
      keputusanAlasan: "Bukti dan mutasi rekening sesuai.",
    },
  });
  await db.donationConfirmation.create({
    data: {
      referensi: "DON-DEMO-0003",
      idempotencyKey: "seed-don-3",
      nama: "Bu Ratna",
      email: "donatur3@contoh.id",
      wa: "081200000003",
      nominalRupiah: 250000,
      keterangan: "Donasi rutin",
      receiptKey: tulisBukti("png"),
      consentAt: new Date("2026-03-07T10:00:00+07:00"),
      leaderboardConsent: false,
      status: "perlu-perbaikan",
      verifiedBy: verifikator?.nama ?? "Verifikator Lembaga",
      verifiedAt: new Date("2026-03-07T14:00:00+07:00"),
      keputusanAlasan: "Bukti tidak terbaca jelas, mohon unggah ulang.",
    },
  });

  // ---- Permohonan sewa demo ----
  const r1 = await db.rentalRequest.create({
    data: {
      referensi: "SEW-DEMO-0001",
      idempotencyKey: "seed-sew-1",
      rentalItemId: itemAula.id,
      penyewa: "Panitia Pengajian Kelurahan",
      kontak: "081300000001",
      alamat: "Jl. Melati No. 1, Purworejo",
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
      referensi: "SEW-DEMO-0002",
      idempotencyKey: "seed-sew-2",
      rentalItemId: itemAula.id,
      penyewa: "Komunitas Belajar Anak",
      kontak: "081300000002",
      alamat: "Jl. Melati No. 2, Purworejo",
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
      referensi: "SEW-DEMO-0003",
      idempotencyKey: "seed-sew-3",
      rentalItemId: itemAula.id,
      penyewa: "Keluarga Warganegara",
      kontak: "081300000003",
      alamat: "Jl. Melati No. 3, Purworejo",
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
      keputusanAlasan: "Jadwal tidak bertabrakan, pengurus menyetujui.",
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
    ["donasi", d1.id, "DON-DEMO-0001"],
    ["persewaan", r1.id, "SEW-DEMO-0001"],
    ["persewaan", r2.id, "SEW-DEMO-0002"],
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
