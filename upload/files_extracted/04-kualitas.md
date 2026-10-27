# KUALITAS (tempel sebelum Prompt 8)

Ini rencana pemeriksaan untuk prototipe. Lakukan dan laporkan hasil **jujur** (lulus/gagal per butir). Jika tidak bisa menjalankan tes di lingkungan ini, tulis berkas tesnya dan katakan belum dijalankan.

## 1. Data uji
- Semua data sintetis. Nomor WA/email fiktif. Bukti transfer tiruan (gambar/PDF kosong berlabel CONTOH).
- Adapter pesan hanya `mock`. Dilarang mengirim ke nomor/alamat nyata.

## 2. Tes wajib
**Hitung (unit, `pricing.ts`):** `Rp500.000`→500000; tolak nominal kosong/nol/negatif/pecahan/format salah; tolak tanggal selesai < mulai, durasi nol, unit bukan bilangan bulat positif. Vektor: aula 500.000+150.000+50.000 = **700.000** · kursi 40×2×5.000 = **400.000** · pindah aula→kursi menghapus tambahan aula · pendidikan 34+56+45+15 = **150** · alokasi 45+30+15+10 = **100%**.
**Upload:** valid ≤5 MB diterima; >5 MB, MIME palsu, signature salah ditolak; kegagalan di tengah proses tidak meninggalkan data setengah jadi dan bukti tidak pernah terbuka publik.
**Otorisasi:** tanpa login ke `/api/admin/*` dan bukti → ditolak; editor memverifikasi donasi → ditolak; verifikator mengubah hak akses → ditolak; manipulasi ID bukti → ditolak; transisi status ilegal ditolak; transisi sah mencatat petugas, waktu, alasan; dua petugas bersamaan → yang kedua ditolak (cek versi).
**Idempotensi:** klik ganda/retry dengan `Idempotency-Key` sama → satu catatan.
**Notifikasi:** pengajuan valid membuat `Notification` yang muncul belum dibaca; adapter gagal → pengajuan tetap tersimpan, delivery "gagal", bisa kirim ulang; isi pesan netral tanpa kata "terverifikasi/lunas/disetujui" dan tanpa bukti/nominal lengkap; kanal keluar default mati; tidak ada endpoint publik untuk notifikasi/PII.
**Berita:** `/api/articles/{slug}` terbit → 200; slug salah/belum terbit/ditarik → 404 dan UI "Berita tidak ditemukan"; kembali ke daftar menjaga filter/halaman; foto tanpa consent tidak tampil; isi berbahaya disanitasi.
**e2e (manual bila perlu):** cari informasi (kosong, ganti kategori → hal. 1) · konfirmasi donasi (valid; email salah/nominal invalid/bukti hilang/>5 MB/tipe palsu ditolak; isian aman saat gagal) · permohonan aula 40 peserta 08.00–16.00 WIB → Rp700.000 · permohonan kursi 40×2 hari → Rp400.000 · verifikasi manual dengan alasan.

## 3. Keamanan (checklist)
- [ ] Akses database hanya di server; tidak ada kunci/rahasia di kode klien (INV-8)
- [ ] Bukti di luar folder publik, nama acak, hanya lewat route berperan verifikator (INV-4)
- [ ] Peran dicek di server, bukan hanya menyembunyikan tombol
- [ ] Validasi server (batas panjang, tipe, nilai) + rate-limit sederhana untuk upload/pengajuan
- [ ] Isi berita disanitasi; keluaran di-escape
- [ ] Log tanpa PII, bukti, atau isi pesan lengkap
- [ ] Akun demo ditandai "ganti sebelum produksi"

## 4. Responsif & aksesibilitas
Periksa 1440/414/375/320 px tanpa scroll horizontal; keyboard & fokus terlihat; kontras ≥4,5:1 (khususnya teks hijau muda); alt foto; label form terhubung; status = teks + ikon; zoom 200%. Periksa manual: tidak ada gradasi dekoratif, emoji ikon, foto stok, atau slogan generik.

## 5. Gerbang prototipe
- [ ] Tes hitung lulus (atau berkas tes siap dijalankan)
- [ ] Semua alur utama berjalan dengan data sintetis
- [ ] Tidak ada fitur di luar ruang lingkup (pembayaran, booking otomatis)
- [ ] Daftar `TODO(OD-xx)` tercatat
- [ ] Pesan sukses dan notifikasi netral (INV-7)
