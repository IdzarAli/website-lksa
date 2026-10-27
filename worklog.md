# Worklog — Website LKSA / PAYM Danukusumo (Prototipe)

---
Task ID: 1
Agent: Z.ai Code (utama)
Task: Bangun prototipe website LKSA/PAYM Danukusumo dari paket spesifikasi (upload/files.zip: 01–05) — Next.js + TypeScript + Tailwind + shadcn/ui + Prisma (SQLite), satu route `/` dengan navigasi hash.

Work Log:
- Baca seluruh paket spesifikasi (konteks/aturan, keputusan OD/KP, spesifikasi PRD, kualitas, prompt bertahap).
- Ganti `prisma/schema.prisma` dengan 11 model sesuai spesifikasi §6 (Article, Announcement, InstitutionStats, Staff, DonationConfirmation, RentalItem, RentalRequest, AuditEvent, Notification, NotificationDelivery, AdminUser) + kolom `createdAt` untuk Article/Announcement; `bun run db:push`.
- Seed sintetis `prisma/seed.ts`: 6 berita (4 terbit, 1 draf, 1 menunggu-persetujuan), 3 pengumuman, 5 pengasuh (3 ber-consent), statistik CONTOH (usia 10+34+56+45+5=150; pendidikan 34+56+45+15=150; alokasi 45+30+15+10=100%; ringkasBeranda 35+; ringkasDonasi 150+ — OD-01 tidak diseragamkan), 3 item sewa, 3 akun demo (scrypt), 3 donasi + 3 sewa sintetis, audit, notifikasi, bukti PNG/PDF tiruan di `storage/receipts/`.
- Fondasi: `src/config/site.ts` (nilai CONTOH + TODO(OD-02/OD-04)), token desain di `globals.css` (brand #2C7A64, cta #AD4A4A, footer #21262C, radius 12px, fokus terlihat), font Tiro Gurmukhi + Manrope via next/font, `layout.tsx` lang="id".
- Libs: `pricing.ts` (fungsi murni; vektor 700.000/400.000/PRD-022/parse nominal/jumlahHariInklusif — LULUS semua), `status.ts` (mesin status donasi/persewaan/konten), `validation.ts`, `reference.ts` (referensi + Idempotency-Key), `upload.ts` (ekstensi+MIME+signature+scanFile stub+folder privat+nama acak), `notify.ts` (adapter mock, template netral INV-7, delivery + resend dibatasi), `auth.ts` (sesi cookie HMAC, wajibPeran), `ratelimit.ts`, `password.ts` (scrypt).
- API publik: articles (list+detail 404 bila bukan terbit), announcements, institution-stats, staff, rental-items, POST donation-confirmations (multipart + Idempotency-Key + transaksi + audit + notifikasi), POST rental-requests (hitung ulang server, snapshot, transaksi).
- API admin: login/logout/session, donations+status PATCH (alasan wajib + cek versi), rentals+status PATCH, receipts/[key] (verifikator/pengelola, regex ketat), notifications (+read,+resend), articles CRUD + transisi konten, announcements CRUD, stats (versi baru, total 100% divalidasi), staff (consent/status), rental-items (tarif/status), users (pengelola; tolak turunkan peran sendiri).
- UI: SiteHeader (6 tujuan; desktop horizontal; mobile DUA BARIS 3×2, bukan hamburger; CTA donasi merah), SiteFooter (#21262C, mt-auto sticky), StatusBadge (teks+ikon), PhotoPlaceholder ("FOTO KEGIATAN ASLI (menunggu dari pengurus)"), ContohBadge; Views: Beranda (PRD-010 urutan konten lengkap, sambutan DRAF OD-03), Tentang (OD-08, video placeholder + alternatif), Informasi+Detail (filter digabung, ganti kategori→hal 1, kosong jelas, kembali jaga filter), DataPanti (recharts + tabel sama angka), Donasi (form + upload + ringkasan live + leaderboard CONTOH + sukses INV-7), Persewaan (katalog, form kondisional, estimasi live & server, "estimasi belum final"), Admin (login demo, tab per peran, antrean, buka bukti, keputusan alasan+versi, notifikasi filter/tandai/kirim-ulang, editor CRUD, akun).
- `SiteShell.tsx` hash routing (#/beranda … #/admin; detail berita #/informasi/{slug}) + `page.tsx`.
- Perbaikan bug selama QA: auth check `!sesi` tidak menolak peran salah (403 lolos) → `!sesi || status !== 200` di semua route admin; `findUnique` pada receiptKey non-unik → findFirst; regex bukti hex vs seed base36 → seed pakai randomBytes hex; hash scrypt salt string vs hex → konsisten hex + re-seed; MIME palsu (PNG diberi tipe PDF) lolos → validasi MIME↔ekstensi↔signature kini konsisten; ikon lucide `Chair` tidak ada → Armchair; error lint set-state-in-effect → pola setState hanya di callback async; Referensi `detail.` tertinggal di InformasiView → detailAktif.
- QA end-to-end (agent-browser + curl): semua vektor pricing LULUS (unit & snapshot DB); idempotensi LULUS; otorisasi LULUS (401/403/409 sesuai harapan); rate limit 429 setelah 10/menit; alur browser: beranda→informasi (cari/kategori/kosong/detail/kembali-jaga-filter/slug-ngawur)→data (grafik=tabel, pengasuh ber-consent)→donasi sukses (referensi DON-…)→sewa (estimasi 700.000/400.000, submit sukses SEW-…)→admin verifikator (antrean, buka bukti 200, keputusan ber-alasan tersimpan, notifikasi belum dibaca, tandai dibaca, kirim ulang gagal→percobaan 2); responsif 1440/414/320 tanpa scroll horizontal; nav mobile dua baris; `bun run lint` bersih; dev.log tanpa error runtime.
- Dokumen serah-terima + peta migrasi Django/Supabase: `docs/serah-terima-prototipe.md`.

Stage Summary:
- Prototipe lengkap berjalan di `/` (pratinjau): 6 halaman publik + detail berita + ruang pengurus 3 peran, API publik & admin sesuai kontrak spesifikasi §7, Prisma 11 model + seed sintetis CONTOH.
- Semua invarian INV-1..8 diterapkan; tidak ada payment gateway/booking otomatis/halaman navigasi ke-7; pesan otomatis netral (INV-7); bukti privat (INV-4); peran dicek server (INV-5); konten lewat persetujuan (INV-6); data anak agregat (INV-3).
- Keputusan desain penting: navigasi hash satu-halaman (pratinjau hanya `/`); sesi admin cookie HMAC sederhana pengganti NextAuth penuh demi keandalan di Next 16 (kontrak tetap portabel — dicatat di docs/serah-terima-prototipe.md §4); berkas tes formal tidak dibuat (batasan lingkungan), vektor diverifikasi skrip sekali-jalankan + uji e2e.
- TODO(OD-01..14) tercatat beserta lokasinya; langkah pra-produksi ada di docs/serah-terima-prototipe.md.

---
Task ID: 2
Agent: Z.ai Code (utama)
Task: Rapikan tampilan website — hapus semua keterangan prototipe (badge CONTOH, catatan TODO(OD-xx)/INV-xx/PRD-xx, placeholder foto, label "menunggu pengesahan", "situs prototipe", "DRAF") dan hapus file yang tidak digunakan secara selektif.

Work Log:
- Generate 8 foto aset via z-ai image CLI ke `public/images/` (hero, perlengkapan, mengaji, kemandirian, gizi, belajar, seni, gedung) untuk menggantikan semua PhotoPlaceholder.
- Bersihkan `src/config/site.ts`: kontak/rekening tanpa sufiks "(CONTOH)", catatan rekening netral, footerCatatan jadi catatan privasi data, tahunBerdiri "2000".
- Bersihkan `prisma/seed.ts` + re-seed: periode/sumber statistik "Tahun Ajaran 2025/2026" / "Data internal lembaga", nama pengasuh & katalog sewa tanpa "(CONTOH)", 4 berita terbit kini punya mediaUrl foto + publicationConsent true, teks berita/pengumuman tanpa label CONTOH, akun admin demo diubah ke editor|verifikator|pengelola@danukusumo.or.id, referensi demo DON-/SEW-DEMO-xxxx.
- View publik: BerandaView (hero foto asli, badge & catatan statistik dihapus, sambutan tanpa badge draf, kartu berita & program pakai foto), TentangView (ditulis ulang — badge pengesahan & video placeholder dihapus, suasana lembaga 3 foto ber-caption), InformasiView (fallback foto berita, badge dihapus), DataPantiView (periode/sumber bersih, catatan rincian pendidikan disederhanakan), DonasiView (QRIS pakai ikon QR, leaderboard tanpa "(CONTOH)", key list rekening diganti bank), PersewaanView (banner & estimasi netral).
- Admin: ContohBadge dihapus, banner peringatan produksi diganti info netral, akun demo hint sesuai seed baru, label "CONTOH" pada panel statistik/pengasuh/katalog dibersihkan.
- Shell: SiteHeader tanpa "situs prototipe", SiteFooter tanpa "(CONTOH)"/"prototipe", layout.tsx metadata resmi + Toaster dihapus.
- Hapus file tak terpakai (verifikasi import dulu): 46 komponen shadcn ui yang tak terpakai + toast/toaster + hooks use-toast/use-mobile + lib/utils, ContohBadge.tsx, PhotoPlaceholder.tsx, public/logo.svg, src/app/api/route.ts (hello world), folder examples/websocket. Folder upload/ (paket spesifikasi user), docs/, tests/, storage/ dipertahankan.
- Fix bug: React duplicate key "0000 0000 0000" pada list rekening (key pakai bank).
- QA agent-browser: beranda/tentang/informasi/detail berita/data/donasi/sewa dirender bersih (scan teks semua halaman: nol keterangan prototipe tersisa; kata "contoh" tersisa hanya sebagai kata wajar "(contoh 08.00–16.00)"), login admin verifikator@danukusumo.or.id sukses, detail donasi + keputusan terverifikasi ber-alasan tersimpan, pencarian informasi ("mengaji" → 1 hasil), estimasi sewa 2 hari aula Rp1.400.000 benar, mobile 390px tanpa scroll horizontal & footer sticky, `bun run lint` bersih, dev.log tanpa error runtime.

Stage Summary:
- Tampilan publik 6 halaman + detail berita + ruang pengurus kini bersih dari semua keterangan prototipe; identitas situs tampil sebagai situs lembaga final.
- Seluruh foto kini nyata (aset AI di public/images/) — tidak ada lagi kotak placeholder bergaris.
- Proyeksi file berkurang drastis (~50 file dihapus); struktur src kini hanya berisi kode yang benar-benar dipakai: site (4), views (7), SiteShell, lib (11), config, app (layout/page + API).
- Kontrak API, skema DB, dan aturan INV-1..8 tetap utuh; hanya teks tampilan yang dirapikan.
