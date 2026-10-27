# Serah-terima Prototipe — Website LKSA / PAYM Danukusumo

Tanggal: 27 Oktober 2026 · Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite) · Mode: prototipe satu-route (`/` dengan navigasi hash)

## 1. Status fitur per ID PRD

| ID | Fitur | Status | Catatan |
|----|-------|--------|---------|
| PRD-010 | Beranda (hero→statistik→profil→sambutan→berita→galeri→CTA) | ✅ Selesai | Statistik dari `InstitutionStats` berperiode & bersumber, CONTOH (OD-01); sambutan bertanda DRAF (OD-03); CTA donasi merah `#AD4A4A` |
| PRD-011 | Tentang Kami (sejarah→visi-misi→video) | ✅ Selesai | Narasi "menunggu pengesahan" (OD-08); video placeholder + pesan alternatif |
| PRD-012 | Informasi & Publikasi | ✅ Selesai | Cari+kategori digabung, ganti kategori → hal. 1, hasil kosong jelas, pengumuman; hanya status `terbit` |
| PRD-016 | Detail berita | ✅ Selesai | Slug salah → "Berita tidak ditemukan"; kembali menjaga filter/halaman; foto hanya bila `publicationConsent`; isi disanitasi (react-markdown, tanpa raw HTML) |
| PRD-013 | Dashboard Informasi & Data Panti | ✅ Selesai | Grafik usia/pendidikan/alokasi + tabel nonwarna; angka grafik = angka tabel (150; 100%); pengasuh hanya ber-consent (OD-07) |
| PRD-014 | Donasi | ✅ Selesai | Rekening/QRIS CONTOH (OD-04); upload JPG/PNG/PDF ≤5 MB (ekstensi+MIME+signature+scanFile stub); idempotensi; leaderboard ilustratif CONTOH, default tidak menampilkan donatur; pesan sukses INV-7 |
| PRD-015 | Usaha Panti/Persewaan | ✅ Selesai | Katalog CONTOH (OD-05); form kondisional; estimasi "belum final" dihitung ulang server; tanpa booking/pembayaran (INV-2) |
| PRD-020/021/022 | Aturan hitung | ✅ Selesai | `src/lib/pricing.ts` fungsi murni; vektor 700.000 / 400.000 / perpindahan jenis terverifikasi (unit + end-to-end + snapshot DB) |
| §4 Admin & notifikasi | Dashboard pengurus 3 peran | ✅ Selesai | editor (konten) / verifikator (antrean+keputusan) / pengelola (akun); otorisasi dicek server per route; Notification + NotificationDelivery; kirim ulang dibatasi |
| §5 Status manual | Mesin status | ✅ Selesai | Donasi: menunggu-verifikasi→{terverifikasi\|perlu-perbaikan\|ditolak}; Persewaan: diajukan→ditinjau→{disetujui\|perlu-perbaikan\|ditolak}; alasan wajib; cek `version` (petugas kedua ditolak 409); AuditEvent |

## 2. Daftar TODO(OD-xx) dan lokasi

| ID | Hal | Lokasi |
|----|-----|--------|
| OD-01 | Angka anak 35+/150/150+ tidak diseragamkan | `prisma/seed.ts` (JSON `usiaAgregat.ringkasBeranda`/`ringkasDonasi`), ditampilkan di Beranda/Donasi/Dashboard |
| OD-02 | Brand LKSA/PAYM belum disahkan | `src/config/site.ts` (`namaLembaga` + `TODO(OD-02)`) |
| OD-03 | Sambutan berstatus DRAF | `src/components/views/BerandaView.tsx` (bagian sambutan) |
| OD-04 | Rekening/QRIS/WA/email/alamat CONTOH | `src/config/site.ts` + ditandai di `DonasiView` & footer |
| OD-05 | Tarif/inventaris/leaderboard CONTOH | `prisma/seed.ts` (RentalItem), `PersewaanView`, `DonasiView` |
| OD-06 | Retensi PII/bukti/backup/audit | Belum ditentukan — catatan: bukti di `storage/receipts/` di luar `public/`; kebijakan retensi = keputusan pengurus |
| OD-07 | Anonim vs nama wajib; consent tampil | `DonasiView` (checkbox terpisah leaderboard), `Staff.publicationConsent` |
| OD-08 | Profil Purworejo 2000 menunggu pengesahan | `siteConfig` + `TentangView` |
| OD-09 | Jenis admin: layar admin Next.js | `src/components/views/AdminView.tsx` |
| OD-10 | Kanal & penerima notifikasi | `siteConfig.notify.enabled = false` (default mati) |
| OD-11 | Penyedia WA: adapter mock | `src/lib/notify.ts` (`send()` antarmuka tunggal) |
| OD-12 | Pemegang peran (3 akun demo) | `prisma/seed.ts`, `AdminView` (peringatan "ganti sebelum produksi") |
| OD-13 | Hosting & Supabase | Diabaikan di prototipe |
| OD-14 | Prototipe hanya referensi | Kontrak API & model dijaga portabel (lihat §3) |

## 3. Peta migrasi ke produksi (Django + PostgreSQL/Supabase)

### Model Prisma → Model Django
| Prisma | Django (app `panti`) | Catatan |
|--------|----------------------|---------|
| Article | `Article` | `status` → TextChoices; `publishedAt` → DateTimeField(null=True) |
| Announcement | `Announcement` | idem |
| InstitutionStats | `InstitutionStats` | field JSON-String → `JSONField` |
| Staff | `Staff` | `publicationConsent` BooleanField |
| DonationConfirmation | `DonationConfirmation` | `receiptKey` → FK ke objek Storage privat; `nominalRupiah` IntegerField |
| RentalItem / RentalRequest | `RentalItem` / `RentalRequest` | `rincianJenis`, `estimasiSnapshot` → JSONField |
| AuditEvent | `AuditEvent` | tanpa PII; log via middleware/sinyal |
| Notification / NotificationDelivery | `Notification` / `NotificationDelivery` | antrian kirim via Celery |
| AdminUser | `User` (Django auth) + `Group` per peran | ganti akun demo |

### Route Handler → Endpoint API (path & payload sama)
| Next.js | Django |
|---------|--------|
| `GET /api/articles?q=&category=&page=` | `GET /api/articles/` |
| `GET /api/articles/{slug}` | `GET /api/articles/{slug}/` |
| `GET /api/announcements` · `/api/institution-stats` · `/api/staff` · `/api/rental-items` | endpoint DRF setara |
| `POST /api/donation-confirmations` (multipart, header `Idempotency-Key`) | `POST /api/donation-confirmations/` |
| `POST /api/rental-requests` (JSON, header `Idempotency-Key`) | `POST /api/rental-requests/` |
| `/api/admin/*` (login/logout/session, donations, rentals, receipts/{key}, notifications, articles, announcements, stats, staff, rental-items, users) | `/api/admin/…` + DRF permission per peran |

### Fungsi & adapter
- `src/lib/pricing.ts` → `panti/pricing.py` (fungsi murni + tes vektor yang sama: 700.000; 400.000; perpindahan jenis; parse nominal).
- `src/lib/notify.ts` (`send(kanal, penerima, templateId, {referensi})`) → adapter interface + antrean tugas (Celery); dashboard channel tetap sinkron.
- Penyimpanan bukti `storage/receipts/` (nama acak) → **bucket privat Supabase Storage** + signed URL berumur pendek, hanya lewat endpoint berperan verifikator.
- Sesi cookie HMAC → auth Django (session/SSO); tetap cek peran **di server** tiap route.

## 4. Yang HANYA simulasi di prototipe

1. **WA & email** — adapter `mock`, kanal default mati; tidak ada pesan keluar nyata (OD-10/OD-11).
2. **`scanFile()`** — stub penolak berkas mencurigakan (executable/script); bukan antivirus sungguhan.
3. **Penyimpanan bukti** — folder lokal `storage/receipts/` (privat, nama acak); bukan object storage.
4. **Akun admin demo** — scrypt sederhana + cookie HMAC; bukan NextAuth penuh (disederhanakan untuk satu-route; kontrak tetap portabel). WAJIB ganti sebelum produksi.
5. **Seluruh data** — sintetis berlabel CONTOH, termasuk bukti transfer (PNG/PDF tiruan).

## 5. Langkah sebelum produksi

1. Ganti seluruh akun demo & mekanisme sesi (OD-12); aktifkan HTTPS; rotasi `SESSION_SECRET`.
2. Isi data resmi: rekening/QRIS sah, kontak, sambutan final, sejarah terverifikasi (OD-02/03/04/08), angka anak dengan periode & sumber resmi (OD-01).
3. Sambungkan penyedia WA/email nyata + antrean tugas; atur penerima notifikasi (OD-10).
4. Ganti `scanFile()` stub dengan pemindai antivirus sungguhan; pindahkan bukti ke bucket privat + signed URL; tetapkan kebijakan retensi/backup/hapus data (OD-06).
5. Migrasi DB ke PostgreSQL; jalankan migrasi Django sesuai §3; audit log aktif.
6. QA ulang: otorisasi, upload, idempotensi, mesin status, rate limit, aksesibilitas (1440/414/375/320 px, kontras, fokus, zoom 200%).
7. Tinjau kode oleh manusia sebelum go-live, terutama otorisasi, upload, dan notifikasi.

## 6. Catatan QA sesi ini (jujur)

- **LULUS** (dijalankan): vektor pricing (aula 700.000; kursi 400.000; tenda tanpa tambahan aula; parse `Rp500.000`→500000; tolak pecahan/nol/negatif/format salah; tanggal selesai<mulai ditolak) · upload valid diterima, MIME palsu ditolak (perbaikan: MIME↔ekstensi↔signature kini konsisten) · idempotensi (kunci sama → 1 catatan, balasan `duplikat:true`) · otorisasi (tanpa login 401; editor verifikasi 403; verifikator hak akses 403; transisi ilegal 409; cek versi 409) · rate limit (429 setelah 10/menit) · alur e2e browser: beranda→informasi (cari/kategori/kosong/detail/kembali-jaga-filter)→data (grafik=tabel)→donasi (sukses + referensi)→sewa (estimasi live 700.000 & 400.000; submit sukses)→admin (antrean, buka bukti, keputusan ber-alasan, notifikasi, tandai dibaca, kirim ulang gagal → percobaan 2) · tanpa scroll horizontal di 1440/414/320 px · nav mobile dua baris (3×2) · footer menempel.
- **TES BERKAS YANG BELUM DIJALANKAN**: unggah berkas >5 MB lewat UI (divalidasi di server; klien menolak sebelum kirim), JPEG nyata (uji memakai PNG/PDF sintetis).
- **CATATAN**: formal test files tidak dibuat (batasan lingkungan pengembangan ini melarang berkas tes); vektor diverifikasi lewat skrip sekali-jalankan dan uji end-to-end di atas. Kualitas: `bun run lint` bersih tanpa error/warning.
