# KEPUTUSAN (tempel kedua)

Tag: `[KEPUTUSAN]` sudah dipilih · `[TERBUKA]` belum diputuskan → jangan pilih sendiri.

## A. Terpilih
| ID | Keputusan | Catatan |
|----|-----------|---------|
| KP-01 | Produksi: Next.js + React untuk frontend, Django untuk backend | Dikerjakan di luar Z.ai |
| KP-02 | Produksi: PostgreSQL via Supabase (hanya DB + Storage privat); auth dipegang Django | Region/paket: OD-13 |
| KP-03 | Dashboard admin dengan notifikasi donasi & persewaan; WA konfirmasi masuk ruang lingkup | Di prototipe: dashboard nyata + WA `mock` |
| KP-04 | Halaman detail berita `/informasi/{slug}` | Bukan item navigasi ketujuh |

## B. Terbuka (dan perilaku sementara di prototipe)
| ID | Hal | Perilaku sementara |
|----|-----|--------------------|
| OD-01 | Jumlah anak: Beranda 35+, dashboard pendidikan 150, hero Donasi 150+ | Tampilkan angka dari data dengan **periode & sumber**; label "contoh"; jangan pilih satu |
| OD-02 | Brand LKSA / PAYM / LKSA PAYM | Satu konfigurasi `site.ts`; nilai awal "LKSA / PAYM Danukusumo" + `TODO(OD-02)` |
| OD-03 | Sambutan mobile bertanda "DRAF SAMBUTAN" | Tandai draf, jangan tayang sebagai final |
| OD-04 | Rekening, QRIS, WA, email, alamat | Variabel konfigurasi berlabel CONTOH; CTA ke kanal belum sah tidak aktif |
| OD-05 | Tarif, inventaris, leaderboard ilustratif | Label "contoh" tetap; leaderboard default tidak dipublikasikan |
| OD-06 | Retensi PII/bukti/backup/audit, hapus/akses data | Catat sebagai TODO; jangan mengarang jangka waktu |
| OD-07 | Anonim vs nama wajib | Simpan identitas internal; tampil publik hanya dengan consent terpisah |
| OD-08 | Profil: Purworejo, berdiri 2000 | Tampilkan sebagai menunggu pengesahan |
| OD-09 | Jenis admin | Bangun layar admin sederhana di Next.js untuk prototipe |
| OD-10 | Kanal & penerima notifikasi | Dashboard aktif; WA/email hanya `mock` dan default mati |
| OD-11 | Penyedia WA | Adapter `mock` dengan antarmuka tunggal |
| OD-12 | Pemegang peran | Tiga peran: editor, verifikator, pengelola akses (akun demo sintetis) |
| OD-13 | Hosting & Supabase | Abaikan di prototipe |
| OD-14 | Prototipe Z.ai hanya referensi (produksi = Django + Supabase) atau menjadi basis produksi (Next.js full-stack + PostgreSQL)? | Anggap prototipe; pertahankan kontrak API dan model agar portabel |
