/**
 * Konfigurasi situs LKSA Danukusumo.
 *
 * Data resmi lembaga (nama, kontak, rekening) di bawah ini adalah satu-satunya
 * sumber kebenaran — jangan pernah hardcode nilai ini di komponen lain;
 * selalu baca dari siteConfig.
 */

export const siteConfig = {
  namaLembaga: "LKSA Danukusumo",
  namaResmi:
    "Lembaga Kesejahteraan Sosial Anak Panti Asuhan Yatim Muhammadiyah (LKSA PAYM) Danukusumo",
  namaPendek: "Danukusumo",
  copyright: "LKSA PAYM Danukusumo",
  lokasi: "Banyuurip, Purworejo, Jawa Tengah",
  motto: "Berbakti Meraih Ridho Ilahi",
  tahunBerdiri: "2000",
  tanggalBerdiri: "15 Juli 2000",

  kontak: {
    alamat:
      "Jl. Timbangan No.9 Kledungkradenan, RT.01/RW.04, Kecamatan Banyuurip, Kabupaten Purworejo, Jawa Tengah",
    email: "pantidanukusumo@gmail.com",
    hp: "0852 7325 4656",
    hpIntl: "6285273254656", // format internasional untuk tautan WhatsApp
    instagram: "lksa_danukusumo",
    youtube: "@lksadanukusumo",
  },

  // Panduan transfer donasi — rekening resmi lembaga.
  donasi: {
    catatanAwal:
      "Donasi dilakukan dengan transfer bank di luar website. Setelah mentransfer, kirim konfirmasi melalui formulir di bawah. Petugas berwenang akan memeriksa secara manual; tidak ada janji waktu verifikasi.",
    rekening: [
      {
        bank: "Bank BRI Cab. Purworejo",
        nomor: "0078-01-024006-50-8",
        atasNama: "PAYM Danukusumo",
        catatan: "Rekening donasi resmi lembaga; dapat ditransfer dari bank mana pun.",
      },
    ],
  },

  // Kanal pesan keluar: adapter notifikasi, default mati (hanya tercatat di dasbor).
  notify: {
    enabled: false,
    maxPercobaan: 3,
  },

  // Batas unggah bukti transfer
  upload: {
    maxUkuranBytes: 5 * 1024 * 1024, // 5 MB
    tipeDiizinkan: ["image/jpeg", "image/png", "application/pdf"],
    ekstensiDiizinkan: ["jpg", "jpeg", "png", "pdf"],
  },

  navigasi: [
    { key: "beranda", label: "Beranda" },
    { key: "tentang", label: "Tentang Kami" },
    { key: "informasi", label: "Informasi & Publikasi" },
    { key: "data", label: "Pengurus Panti" },
    { key: "donasi", label: "Donasi" },
    { key: "sewa", label: "Usaha Panti" },
  ] as const,
} as const;

export type NavKey = (typeof siteConfig.navigasi)[number]["key"];
