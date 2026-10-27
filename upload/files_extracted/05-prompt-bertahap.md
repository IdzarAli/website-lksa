# PROMPT BERTAHAP

Salin **satu prompt per giliran**. Setelah tiap prompt: buka pratinjau, lakukan "Periksa sendiri", baru lanjut. Pastikan `01`, `02`, `03` sudah ditempel di awal percakapan (dan `04` sebelum Prompt 8).

---

## Prompt 0 — Orientasi (tanpa kode)
```
Baca konteks, keputusan, dan spesifikasi yang sudah saya berikan. Jangan menulis kode dulu.
Jawab singkat:
1. Sebutkan INV-1 sampai INV-8 dengan kata-katamu sendiri.
2. Sebutkan OD yang masih terbuka dan apa yang akan kamu lakukan untuk tiap OD (perilaku sementara).
3. Sebutkan hal yang TIDAK akan kamu bangun.
4. Tulis rencana 8 langkah pembangunan (satu fitur per langkah) dan file utama tiap langkah.
Tanyakan hanya jika ada aturan yang bertentangan.
```
**Periksa sendiri:** ringkasan benar (donasi = konfirmasi, persewaan = permohonan, pesan netral, data anak agregat). Jika salah, koreksi dan minta ulang.

---

## Prompt 1 — Fondasi, token, layout, navigasi
```
Kerjakan fondasi saja:
- Buat src/config/site.ts (nama lembaga, kontak, rekening/QRIS CONTOH, berlabel TODO(OD-02/OD-04)).
- Definisikan token desain (warna #2C7A64, #AD4A4A, #21262C, font judul serif Tiro Gurmukhi dengan fallback, font isi Manrope, radius 8–16 px) sebagai variabel Tailwind/CSS, satu kali, dan pakai ulang.
- Buat layout: header dengan navigasi enam tujuan (desktop horizontal; mobile dua baris tujuan, bukan hamburger), footer (#21262C), dan komponen dasar: tombol primer/sekunder, kartu, lencana status (teks + ikon), input/select/label, pesan validasi, placeholder foto "FOTO KEGIATAN ASLI (menunggu dari pengurus)".
- Siapkan enam tampilan kosong berjudul (Beranda, Tentang Kami, Informasi & Publikasi, Dashboard Informasi & Data Panti, Donasi, Usaha Panti/Persewaan). Jika pratinjau hanya menampilkan route "/", bangun sebagai tampilan di satu halaman dengan state navigasi dan komponen terpisah per halaman.
- Prisma: buat model sesuai spesifikasi §6 dan seed sintetis §8. Jalankan push skema.
Selesai bila: navigasi benar di 1440/414/320 px tanpa scroll horizontal; token dipakai ulang; tidak ada gradasi/emoji ikon. Laporkan per butir.
```
**Periksa sendiri:** warna sesuai, navigasi mobile dua baris, tidak ada tampilan "template generik".

---

## Prompt 2 — Beranda & Tentang Kami
```
Bangun Beranda (PRD-010) dan Tentang Kami (PRD-011) mengikuti urutan konten di spesifikasi §1.
- Statistik dibaca dari data (InstitutionStats) dan SELALU menampilkan periode dan sumber, berlabel CONTOH. Jangan memilih antara 35+/150/150+ (TODO(OD-01)).
- Sambutan berstatus draf (TODO(OD-03)). Video: placeholder dengan pesan alternatif/transkrip.
- CTA donasi (merah #AD4A4A) menuju halaman Donasi.
- Galeri/program hanya bagian konten Beranda, bukan halaman baru.
Selesai bila: urutan konten sesuai; teks spesifik, tanpa slogan generik; kontras terpenuhi; heading semantik. Laporkan per butir.
```

---

## Prompt 3 — Informasi & Publikasi + detail berita
```
Bangun Informasi & Publikasi (PRD-012) dan detail berita (PRD-016):
- GET /api/articles?q=&category=&page= dan GET /api/articles/{slug} (hanya status "terbit"; selain itu 404).
- UI: pencarian + kategori yang bisa digabung, kartu berita dengan foto/placeholder + ringkasan, pagination yang menjaga filter, pengumuman. Ganti kategori → halaman 1. Hasil kosong: "Informasi belum ditemukan. Coba kata kunci lain." + tombol hapus filter.
- Klik kartu → detail berita (judul, tanggal, kategori, foto beralt, isi disanitasi, tombol "Kembali ke daftar" yang menjaga pencarian/kategori/halaman). Slug salah → "Berita tidak ditemukan".
- Foto hanya tampil bila publicationConsent = true.
Tulis tes/fungsi untuk logika filter jika memungkinkan. Selesai bila semua butir PRD-012 dan PRD-016 terpenuhi. Laporkan per butir.
```
**Periksa sendiri:** coba cari kata yang tidak ada; buka slug ngawur; kembali dari detail dan cek filter terjaga.

---

## Prompt 4 — Dashboard Informasi & Data Panti
```
Bangun Dashboard Informasi & Data Panti (PRD-013): grafik usia/pendidikan, alokasi dana, rincian pendidikan, direktori pengasuh.
- Agregat saja. Direktori pengasuh hanya atribut profil yang disetujui (Staff.publicationConsent). Jangan menampilkan data individu anak.
- Setiap grafik punya label angka, legenda, dan tabel/ringkasan nonwarna. Angka grafik harus sama dengan tabel.
- Data dari InstitutionStats seed (pendidikan 34+56+45+15 = 150; alokasi 45/30/15/10 = 100%), periode & sumber tampil, berlabel CONTOH (TODO(OD-01)).
Selesai bila: grafik = tabel, aksesibel, tanpa scroll horizontal di 320 px. Laporkan per butir.
```

---

## Prompt 5 — Donasi (form, API, upload, notifikasi)
```
Bangun halaman Donasi (PRD-014) sesuai INV-1 dan INV-7:
- Panduan transfer bank/QRIS memakai nilai dari site.ts (CONTOH, TODO(OD-04)).
- Form: nama, email, WhatsApp, nominal (parse "Rp500.000" → 500000; tolak kosong/nol/negatif/pecahan), keterangan, unggah bukti (JPG/PNG/PDF ≤ 5 MB), checkbox persetujuan verifikasi, dan checkbox TERPISAH opsional untuk tampil di leaderboard (tidak dicentang otomatis; default tidak dipublikasikan). Ringkasan mengikuti nominal/bukti.
- Keadaan UI: awal, memuat ("Mengirim konfirmasi…", cegah kirim ulang), gagal (pesan per kolom + ringkasan, fokus ke masalah pertama, isian aman), berhasil ("Konfirmasi diterima. Menunggu verifikasi pengurus." + nomor referensi).
- POST /api/donation-confirmations (multipart) dengan header Idempotency-Key: validasi server (tipe, ukuran, ekstensi, MIME, signature), scanFile() stub, simpan bukti di luar folder publik dengan nama acak, simpan DonationConfirmation (status "menunggu-verifikasi"), AuditEvent, dan Notification dalam satu transaksi. Respons hanya referensi + status.
- Setelah tersimpan, panggil adapter notify (mock) untuk pesan netral; kegagalan tidak membatalkan pengajuan (catat NotificationDelivery gagal).
- Leaderboard ilustratif berlabel "CONTOH", default tidak menampilkan data donatur.
Tulis tes untuk parsing nominal dan idempotensi bila memungkinkan. Selesai bila semua butir PRD-014 terpenuhi dan tidak ada kata "terverifikasi/lunas" di pesan. Laporkan per butir.
```
**Periksa sendiri:** kirim dua kali dengan kunci sama (satu catatan); unggah berkas 6 MB (ditolak); cek bukti tidak bisa dibuka lewat URL publik.

---

## Prompt 6 — Usaha Panti/Persewaan
```
Bangun halaman Usaha Panti/Persewaan (PRD-015) sesuai INV-2:
- Katalog contoh aula/kursi/tenda dari RentalItem (tarif CONTOH, TODO(OD-05)).
- Fungsi murni src/lib/pricing.ts: aula 500.000 + sound 150.000 + kebersihan 50.000 = 700.000; kursi 40 × 2 hari × 5.000 = 400.000; pindah ke kursi/tenda menghapus tambahan aula. Tulis berkas tes untuk semua vektor ini dulu.
- Form kondisional: Aula (kegiatan, peserta, jam, sesi 8 jam), Kursi/tenda (unit, lokasi, hari). Saat jenis berubah, server mengosongkan/mengabaikan kolom tersembunyi.
- Ringkasan & estimasi berlabel "estimasi belum final". Tombol "Ajukan Persewaan". Sukses: referensi + "menunggu pemeriksaan pengurus". Tidak mengunci jadwal, tidak meminta pembayaran.
- POST /api/rental-requests dengan Idempotency-Key: validasi (tanggal selesai ≥ mulai, durasi >0, unit bilangan bulat positif, consent), hitung ulang estimasi DI SERVER, simpan snapshot, AuditEvent, Notification dalam satu transaksi, lalu notify (mock).
Selesai bila PRD-015, PRD-020, PRD-021, PRD-022 terpenuhi. Laporkan per butir, termasuk hasil tes.
```

---

## Prompt 7 — Admin & notifikasi
```
Bangun dashboard admin sederhana (peran: editor, verifikator, pengelola) memakai NextAuth credentials dan akun demo sintetis:
- Cek peran DI SERVER pada semua /api/admin/* dan pembacaan bukti. Editor tidak boleh memverifikasi donasi; verifikator tidak boleh mengubah hak akses.
- Editor: CRUD berita (status draf → menunggu-persetujuan → terbit/ditarik; media dengan alt + consent), pengumuman, statistik, pengasuh, katalog/tarif.
- Verifikator: antrean donasi & persewaan, buka bukti lewat route terautentikasi, ubah status SESUAI mesin status (spesifikasi §5) dengan ALASAN wajib dan cek versi (tolak bila versi berbeda), tercatat di AuditEvent.
- Notifikasi: daftar "perlu ditinjau" dengan penanda belum dibaca, filter jenis/status/belum dibaca, tandai dibaca, kirim ulang pesan gagal (percobaan dibatasi). Daftar tidak menampilkan bukti atau data pribadi berlebih.
- Tandai akun demo "ganti sebelum produksi".
Selesai bila: alur admin berjalan, otorisasi diuji (tanpa login ditolak, salah peran ditolak, transisi ilegal ditolak), notifikasi muncul saat ada pengajuan baru. Laporkan per butir.
```

---

## Prompt 8 — QA, keamanan, aksesibilitas
```
Berdasarkan dokumen KUALITAS yang saya tempel, lakukan pemeriksaan dan perbaikan:
1. Jalankan/siapkan semua tes di bagian "Tes wajib" dan laporkan lulus/gagal per butir secara jujur (jika tidak bisa dijalankan, katakan).
2. Periksa checklist keamanan; perbaiki yang gagal.
3. Periksa responsif 1440/414/375/320 px dan aksesibilitas (kontras, fokus, label, alt, zoom 200%).
4. Cari semua tempat yang menulis "terverifikasi/lunas/disetujui" di pesan otomatis dan perbaiki (INV-7).
5. Cari fitur di luar ruang lingkup dan hapus.
Beri daftar temuan dengan ID aturan, status (diperbaiki/belum), dan sisa TODO(OD-xx). Jangan mengklaim lulus tanpa bukti.
```

---

## Prompt 9 — Serah-terima & peta migrasi
```
Buat ringkasan serah-terima (tanpa mengubah kode):
1. Daftar fitur yang selesai vs belum, per ID PRD.
2. Daftar TODO(OD-xx) dan lokasi file-nya.
3. Peta migrasi ke produksi (Django + PostgreSQL/Supabase): tiap model Prisma → model Django; tiap Route Handler → endpoint API dengan path dan payload yang sama; fungsi pricing.ts → modul Python dengan tes yang sama; adapter notify → antarmuka adapter + antrean tugas; penyimpanan bukti → bucket privat + signed URL.
4. Hal yang hanya simulasi di prototipe (WA, scanFile, penyimpanan bukti, akun demo).
5. Daftar langkah sebelum produksi (ganti akun demo, data nyata hanya setelah disahkan, backup, retensi).
Format: markdown ringkas.
```
**Setelah ini:** simpan hasilnya sebagai `docs/serah-terima-prototipe.md` di repo, lalu gunakan paket `danukusumo-opencode/` untuk membangun Django + Supabase.
