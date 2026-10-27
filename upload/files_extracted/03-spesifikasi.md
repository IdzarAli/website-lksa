# SPESIFIKASI (tempel ketiga)

Dasar: 12 frame desain sumber (6 halaman × desktop 1440 px & mobile 414 px). Angka, tarif, ringkasan, dan leaderboard pada sumber **bukan data terverifikasi**; tampilkan berlabel "CONTOH".

## 1. Halaman publik
| ID | Halaman | Isi | Penerimaan |
|----|---------|-----|------------|
| PRD-010 | Beranda | Hero, statistik, profil, sambutan, berita, galeri, ajakan donasi | CTA menuju tujuan benar; sambutan berstatus draf (OD-03); statistik bersumber & berperiode (OD-01) |
| PRD-011 | Tentang Kami | Sejarah, visi-misi, video profil | Narasi menunggu pengesahan (OD-08); video punya pesan alternatif |
| PRD-012 | Informasi & Publikasi | Cari, kategori, kartu berita + foto, pengumuman, pagination | Kueri+kategori bisa digabung; ganti kategori → halaman 1; hasil kosong jelas; klik kartu → detail |
| PRD-016 | Detail berita | Judul, tanggal, kategori, foto, isi, tombol kembali | Hanya berita terbit; kembali menjaga filter/halaman; slug salah → "Berita tidak ditemukan"; foto beralt dan berizin |
| PRD-013 | Dashboard Informasi & Data Panti | Grafik usia/pendidikan, alokasi dana, rincian pendidikan, pengasuh | Agregat saja; angka grafik = tabel |
| PRD-014 | Donasi | Panduan transfer, form konfirmasi, ringkasan, leaderboard ilustratif | JPG/PNG/PDF ≤ 5 MB; tersimpan "menunggu verifikasi" |
| PRD-015 | Usaha Panti/Persewaan | Katalog contoh, kolom kondisional, rincian biaya, permohonan | Jenis mengubah kolom; estimasi sesuai rincian; tidak mengunci jadwal/meminta bayar |

Urutan konten: Beranda hero→statistik→profil→sambutan→berita→galeri→CTA→footer · Tentang sejarah→visi-misi→video · Informasi cari/kategori→berita→pagination→pengumuman · Detail kembali→judul→tanggal&kategori→foto→isi · Data usia→pendidikan→alokasi→rincian→pengasuh · Donasi panduan/rekening→form · Persewaan katalog→form→estimasi.
Navigasi: enam tujuan; desktop horizontal, mobile **dua baris tujuan** (bukan hamburger). Detail berita bukan item navigasi.

## 2. Alur
**Donasi:** baca rekening/QRIS (CONTOH) → transfer di luar web → isi nama, email, WA, nominal, keterangan + unggah bukti + persetujuan verifikasi (+ pilihan terpisah opsional leaderboard, tidak dicentang) → Kirim Konfirmasi → server simpan (menunggu verifikasi), audit, notifikasi → tampil referensi + "Konfirmasi diterima. Menunggu verifikasi pengurus."
**Persewaan:** pilih aula/kursi/tenda → isi jadwal, rincian sesuai jenis, data penyewa, tambahan, persetujuan dihubungi → tinjau estimasi → Ajukan Persewaan → server simpan (diajukan, snapshot estimasi), audit, notifikasi.

## 3. Aturan hitung (wajib; fungsi murni `src/lib/pricing.ts`)
| ID | Kasus | Hasil |
|----|-------|-------|
| PRD-020 | Aula: 500.000 (1 ruang × 1 sesi 8 jam) + sound 150.000 + kebersihan 50.000 | **Rp700.000** |
| PRD-021 | Kursi: 40 × 2 hari × 5.000 | **Rp400.000** |
| PRD-022 | Pindah ke kursi/tenda | Tambahan aula **tidak ikut** |
Tarif = CONTOH (OD-05). Hitung ulang estimasi **di server**; jangan percaya total dari browser. Nominal donasi integer rupiah; `Rp500.000` → 500000.
Kolom kondisional: Aula (kegiatan, peserta, jam, sesi 8 jam); Kursi/tenda (unit, lokasi, hari). Saat jenis berubah, server mengosongkan/mengabaikan kolom tersembunyi dan menghapus tambahan aula.

## 4. Admin & notifikasi
| Peran | Hak |
|-------|-----|
| editor | Berita, pengumuman, media (alt + consent), statistik, pengasuh, katalog/tarif |
| verifikator | Antrean donasi/persewaan, buka bukti (hanya lewat route terautentikasi), ubah status **dengan alasan**, baca notifikasi |
| pengelola | Akun dan peran |
- Editor tidak boleh memverifikasi donasi; verifikator tidak boleh mengubah hak akses. Ubah status wajib alasan + audit. Konten baru lewat persetujuan sebelum terbit.
- Pengajuan baru → `Notification` di dashboard (daftar "perlu ditinjau", penanda belum dibaca; filter jenis/status/belum dibaca). Daftar tidak menampilkan bukti atau data pribadi berlebih.
- WA/email lewat adapter `mock` (`src/lib/notify.ts`, antarmuka `send(kanal, penerima, templateId, {referensi})`), default mati, dijalankan **setelah** pengajuan tersimpan; gagal kirim tidak membatalkan pengajuan (catat `NotificationDelivery.status="gagal"`, bisa kirim ulang, percobaan dibatasi).
- Template netral, mis. "Pengajuan Anda dengan referensi {ref} sudah kami terima dan menunggu pemeriksaan pengurus." Tanpa bukti, nominal lengkap, atau data pribadi berlebih.
- Auth admin: NextAuth (credentials) dengan akun demo sintetis; **wajib ganti sebelum produksi**. Cek peran **di server** pada setiap route admin dan pembacaan bukti.

## 5. Status manual
Donasi: menunggu verifikasi → terverifikasi | perlu perbaikan | ditolak. Persewaan: diajukan → ditinjau → disetujui | perlu perbaikan | ditolak. Transisi lain ditolak server. Pemeriksaan versi (`version`) agar dua petugas tidak saling menimpa.

## 6. Model data (Prisma, SQLite)
```prisma
model Article { id String @id @default(cuid()); slug String @unique; judul String; ringkasan String; isi String; kategori String
  mediaUrl String?; mediaAlt String?; publicationConsent Boolean @default(false); publishedAt DateTime?
  status String @default("draf") } // draf | menunggu-persetujuan | terbit | ditarik
model Announcement { id String @id @default(cuid()); judul String; isi String; kategori String; prioritas String; publishedAt DateTime?; status String @default("draf") }
model InstitutionStats { id String @id @default(cuid()); periode String; usiaAgregat String; pendidikanAgregat String; alokasi String; sumber String; approvedBy String? } // JSON di String
model Staff { id String @id @default(cuid()); nama String; peran String; foto String?; publicationConsent Boolean @default(false); status String @default("draf") }
model DonationConfirmation { id String @id @default(cuid()); referensi String @unique; idempotencyKey String @unique
  nama String; email String; wa String; nominalRupiah Int; keterangan String?; receiptKey String; consentAt DateTime
  leaderboardConsent Boolean @default(false); status String @default("menunggu-verifikasi")
  verifiedBy String?; verifiedAt DateTime?; keputusanAlasan String?; version Int @default(1); createdAt DateTime @default(now()) }
model RentalItem { id String @id @default(cuid()); nama String; jenis String; satuan String; tarifContoh Int; tambahan String; status String @default("draf") }
model RentalRequest { id String @id @default(cuid()); referensi String @unique; idempotencyKey String @unique; rentalItemId String
  penyewa String; kontak String; alamat String; jadwal String; rincianJenis String; estimasiSnapshot String
  status String @default("diajukan"); keputusanAlasan String?; version Int @default(1); createdAt DateTime @default(now()) }
model AuditEvent { id String @id @default(cuid()); actorId String?; aksi String; entityType String; entityId String; perubahanStatus String?; waktu DateTime @default(now()) } // tanpa isi bukti/PII
model Notification { id String @id @default(cuid()); jenis String; entityType String; entityId String; referensi String; createdAt DateTime @default(now()); dibacaOleh String?; dibacaAt DateTime? }
model NotificationDelivery { id String @id @default(cuid()); notificationId String; kanal String; penerima String; status String @default("antri"); percobaan Int @default(0); errorRingkas String?; sentAt DateTime? }
model AdminUser { id String @id @default(cuid()); email String @unique; nama String; role String; passwordHash String } // role: editor | verifikator | pengelola
```
Aturan: bukti disimpan **di luar folder publik** dan hanya dibaca lewat route terautentikasi berperan verifikator; nama berkas acak (`receiptKey`); batasi JPG/PNG/PDF ≤ 5 MB, cek ekstensi, MIME, dan signature; fungsi pemindaian malware berupa stub `scanFile()` yang menolak berkas mencurigakan (placeholder untuk produksi). Isi berita disanitasi.

## 7. Endpoint (Route Handlers; kontrak ini dipertahankan saat migrasi ke Django)
Publik: `GET /api/articles?q=&category=&page=` · `GET /api/articles/{slug}` (404 bila belum terbit) · `GET /api/announcements` · `GET /api/institution-stats` · `GET /api/staff` · `GET /api/rental-items` · `POST /api/donation-confirmations` (multipart, header `Idempotency-Key`) · `POST /api/rental-requests` (header `Idempotency-Key`). GET hanya proyeksi publik; POST memvalidasi payload/consent/berkas dan membalas minimal referensi + status menunggu. Tidak ada endpoint publik untuk daftar PII, notifikasi, atau ubah status.
Admin (terautentikasi + peran): `/api/admin/*` untuk CRUD konten, `PATCH` status (dengan alasan + versi), daftar notifikasi, tandai dibaca, kirim ulang pesan, baca bukti.

## 8. Data awal sintetis (seed)
Beberapa berita (terbit/draf) dan pengumuman berlabel CONTOH; statistik contoh periode "CONTOH": pendidikan 34+56+45+15 = 150, alokasi 45% pendidikan, 30% makanan, 15% kesehatan, 10% operasional = 100%; 3 item sewa (aula, kursi, tenda) tarif contoh; 3 akun demo (editor, verifikator, pengelola); beberapa pengajuan donasi/sewa sintetis dengan nomor fiktif.
