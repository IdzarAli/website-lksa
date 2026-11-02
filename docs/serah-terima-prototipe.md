# Serah-terima Website LKSA Danukusumo

Tanggal pembaruan: 29 Oktober 2026
Arsitektur: Next.js 16 (App Router) + Django 5.2 + SQLite
Mode: satu route `/` dengan navigasi hash, API JSON di bawah `/api/`

## 1. Status fitur

| ID | Fitur | Status | Catatan |
|----|-------|--------|---------|
| PRD-010 | Beranda | Selesai | Statistik periode/sumber (CONTOH), sambutan DRAF, CTA donasi |
| PRD-011 | Tentang Kami | Selesai | Narasi menunggu pengesahan; video placeholder |
| PRD-012 | Informasi & Publikasi | Selesai | Cari + kategori, paginasi, hanya konten `terbit` |
| PRD-016 | Detail berita | Selesai | Slug salah → pesan jelas; kembali menjaga filter |
| PRD-013 | Data Panti | Selesai | Grafik = tabel; pengasuh hanya yang ber-consent |
| PRD-014 | Donasi | Selesai | Upload JPG/PNG/PDF ≤ 5 MB, idempotensi, leaderboard opsional |
| PRD-015 | Persewaan | Selesai | Estimasi dihitung ulang di server; tanpa booking/pembayaran |
| PRD-020–022 | Aturan hitung | Selesai | `src/lib/pricing.ts` + `backend/panti/pricing.py` |
| Admin | Ruang Pengurus 3 peran | Selesai | editor / verifikator / pengelola, otorisasi di server |
| Status | Mesin status & audit | Selesai | Alasan wajib, cek versi (409), AuditEvent |

## 2. Struktur backend

| Bagian | Isi |
|--------|-----|
| `backend/panti/models.py` | 11 model: Article, Announcement, InstitutionStats, Staff, DonationConfirmation, RentalItem, RentalRequest, AuditEvent, Notification, NotificationDelivery, AdminUser |
| `backend/panti/views_public.py` | Artikel, pengumuman, statistik, pengasuh, katalog, donasi, permohonan sewa |
| `backend/panti/views_admin.py` | Login/logout/sesi, antrean donasi & sewa, bukti transfer, notifikasi, konten, statistik, pengasuh, item sewa, akun |
| `backend/panti/auth.py` | Pemeriksaan sesi & peran per endpoint |
| `backend/panti/services.py` | Transisi status, slug, audit |
| `backend/panti/storage.py` | Bukti privat di `backend/storage/receipts/` |
| `backend/panti/management/commands/` | `seed` (data demo) dan `buatadmin` (akun pengurus) |
| `backend/panti/tests.py` | 13 tes API (publik, donasi, sewa, otorisasi, status) |

Frontend memanggil URL `/api/*` seperti sebelumnya. `next.config.ts` mem-proxy
ke Django (`DJANGO_API_URL`, default `http://127.0.0.1:8000`) sehingga tidak ada
CORS dan cookie sesi tetap same-origin.

## 3. TODO keputusan pengurus (OD)

| ID | Hal | Lokasi |
|----|-----|--------|
| OD-01 | Angka anak 35+/150/150+ belum diseragamkan | `backend/panti/management/commands/seed.py` |
| OD-02 | Nama LKSA/PAYM belum disahkan | `src/config/site.ts` |
| OD-03 | Sambutan masih DRAF | `src/components/views/BerandaView.tsx` |
| OD-04 | Rekening/QRIS/WA/email/alamat CONTOH | `src/config/site.ts`, `DonasiView`, footer |
| OD-05 | Tarif, inventaris, leaderboard CONTOH | seed + `PersewaanView`, `DonasiView` |
| OD-06 | Retensi PII, bukti, backup, audit | kebijakan pengurus; bukti di `backend/storage/receipts/` |
| OD-07 | Anonim vs nama wajib; consent tampil | `DonasiView`, `Staff.publicationConsent` |
| OD-08 | Profil Purworejo 2000 menunggu pengesahan | `src/config/site.ts`, `TentangView` |
| OD-09 | Jenis admin | `src/components/views/AdminView.tsx` |
| OD-10/11 | Kanal & penyedia notifikasi | `backend/panti/notify.py`, `NOTIFY_ENABLED=False` |
| OD-12 | Pemegang peran (3 akun demo) | seed + `AdminView` |

## 4. Yang masih simulasi

1. **WA & email** — adapter mock, kanal nonaktif secara default.
2. **Pemindaian berkas** — validasi ekstensi, MIME, dan signature; bukan antivirus.
3. **Penyimpanan bukti** — folder lokal privat, bukan object storage.
4. **Akun demo** — wajib diganti sebelum produksi.
5. **Seluruh data** — sintetis dan berlabel CONTOH, termasuk bukti transfer.

## 5. Sebelum produksi

1. Ganti akun demo dengan `node scripts/backend.mjs buatadmin ...`, ganti
   `DJANGO_SECRET_KEY`, aktifkan HTTPS dan cookie `Secure`.
2. Isi data resmi: rekening/QRIS, kontak, sambutan, sejarah, angka periode resmi.
3. Sambungkan penyedia WA/email nyata bila notifikasi diaktifkan.
4. Ganti pemindaian berkas dengan antivirus; tetapkan retensi/backup/hapus data.
5. Untuk trafik besar, pindahkan SQLite ke PostgreSQL dan jalankan migrasi.
6. QA ulang: otorisasi, upload, idempotensi, transisi status, rate limit,
   aksesibilitas (1440/414/375/320 px, kontras, fokus, zoom 200%).
7. Tinjau kode oleh manusia, terutama otorisasi, upload, dan notifikasi.

## 6. Catatan QA

- **Lulus:** 13 tes Django (`npm run test:backend`), build TypeScript tanpa error,
  login/sesi lewat proxy Next.js, daftar artikel/pengumuman/statistik, antrean
  donasi & sewa, akses bukti privat, respons 401/404 JSON, dan JSON sewa
  (`jadwal`, `rincianJenis`, `estimasiSnapshot`) sesuai kontrak lama.
- **Belum diuji:** unggah > 5 MB lewat UI, JPEG asli (uji memakai PNG/PDF
  sintetis), dan uji beban.
- Bukti transfer tetap privat: hanya verifikator/pengelola yang dapat membukanya.
