/**
 * Konfigurasi situs LKSA / PAYM Danukusumo.
 *
 * Semua nilai kontak, rekening, QRIS, WA, email, dan alamat di bawah ini
 * adalah nilai sementara milik lembaga — jangan pernah hardcode nilai ini
 * di komponen lain; selalu baca dari siteConfig.
 */

export const siteConfig = {
  namaLembaga: "LKSA / PAYM Danukusumo",
  namaPendek: "Danukusumo",
  lokasi: "Purworejo, Jawa Tengah",
  tahunBerdiri: "2000",

  kontak: {
    alamat: "Jl. Danukusumo No. 123, Purworejo, Jawa Tengah",
    email: "sekretariat@danukusumo.or.id",
    wa: "0800-0000-0000",
    jamLayanan: "Hari kerja, 08.00–15.00 WIB",
  },

  // Panduan transfer donasi — rekening resmi diterbitkan oleh pengurus lembaga.
  donasi: {
    catatanAwal:
      "Donasi dilakukan dengan transfer bank/QRIS di luar website. Setelah mentransfer, kirim konfirmasi melalui formulir di bawah. Petugas berwenang akan memeriksa secara manual; tidak ada janji waktu verifikasi.",
    rekening: [
      {
        bank: "Bank BRI",
        nomor: "0000 0000 0000",
        atasNama: "Yayasan Danukusumo",
        catatan: "Nomor rekening resmi diterbitkan oleh pengurus lembaga.",
      },
      {
        bank: "Bank BCA",
        nomor: "0000 0000 0000",
        atasNama: "Yayasan Danukusumo",
        catatan: "Nomor rekening resmi diterbitkan oleh pengurus lembaga.",
      },
    ],
    qrisCatatan: "Pindai kode QRIS dengan aplikasi pembayaran Anda.",
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
