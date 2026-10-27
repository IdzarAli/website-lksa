/**
 * Konfigurasi situs LKSA / PAYM Danukusumo.
 *
 * SEMUA nilai kontak, rekening, QRIS, WA, email, dan alamat di bawah ini
 * adalah NILAI CONTOH untuk prototipe — BUKAN data resmi lembaga.
 * (OD-02, OD-04) → TODO(OD-02), TODO(OD-04): ganti dengan nilai resmi
 * setelah disahkan pengurus. Jangan pernah hardcode nilai ini di komponen lain.
 */

export const siteConfig = {
  // TODO(OD-02): brand belum disahkan — "LKSA" / "PAYM" / "LKSA PAYM"
  namaLembaga: "LKSA / PAYM Danukusumo",
  namaPendek: "Danukusumo",
  // TODO(OD-08): profil Purworejo & tahun berdiri menunggu pengesahan
  lokasi: "Purworejo, Jawa Tengah",
  tahunBerdiri: "2000 (menunggu pengesahan)",

  // Semua kontak berikut = CONTOH. TODO(OD-04)
  kontak: {
    alamat: "Jl. Contoh No. 123, Purworejo, Jawa Tengah (CONTOH)",
    email: "sekretariat@contoh.id (CONTOH)",
    wa: "0800-0000-0000 (CONTOH)",
    jamLayanan: "Hari kerja, 08.00–15.00 WIB (CONTOH)",
  },

  // Panduan transfer donasi — SEMUA REKENING & QRIS CONTOH. TODO(OD-04)
  donasi: {
    catatanAwal:
      "Donasi dilakukan dengan transfer di luar website (INV-1). Setelah mentransfer, kirim konfirmasi melalui formulir di bawah. Petugas berwenang akan memeriksa secara manual; tidak ada janji waktu verifikasi.",
    rekening: [
      {
        bank: "Bank Contoh 001 (CONTOH)",
        nomor: "0000000000",
        atasNama: "Yayasan Contoh Danukusumo",
        catatan: "Nomor rekening CONTOH — kanal belum sah, jangan ditransfer sungguhan",
      },
      {
        bank: "Bank Contoh 002 (CONTOH)",
        nomor: "1111111111",
        atasNama: "Yayasan Contoh Danukusumo",
        catatan: "Nomor rekening CONTOH — kanal belum sah, jangan ditransfer sungguhan",
      },
    ],
    qrisCatatan:
      "QRIS CONTOH — belum sah untuk pembayaran sungguhan. Petunjuk resmi akan diterbitkan pengurus.",
  },

  // Kanal pesan keluar (OD-10, OD-11): adapter mock, DEFAULT MATI
  notify: {
    enabled: false, // WA/email keluar dimatikan di prototipe; hanya tercatat di dashboard
    maxPercobaan: 3,
  },

  // Batas unggah bukti transfer (PRD-014)
  upload: {
    maxUkuranBytes: 5 * 1024 * 1024, // 5 MB
    tipeDiizinkan: ["image/jpeg", "image/png", "application/pdf"],
    ekstensiDiizinkan: ["jpg", "jpeg", "png", "pdf"],
  },

  navigasi: [
    { key: "beranda", label: "Beranda" },
    { key: "tentang", label: "Tentang Kami" },
    { key: "informasi", label: "Informasi & Publikasi" },
    { key: "data", label: "Dashboard Informasi & Data Panti" },
    { key: "donasi", label: "Donasi" },
    { key: "sewa", label: "Usaha Panti/Persewaan" },
  ] as const,

  footerCatatan:
    "Situs prototipe. Seluruh angka, tarif, nama, dan kontak ditandai CONTOH dan belum merupakan data resmi lembaga.",
} as const;

export type NavKey = (typeof siteConfig.navigasi)[number]["key"];
