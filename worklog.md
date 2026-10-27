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

---
Task ID: 3
Agent: Z.ai Code (utama)
Task: Jawab "dashboard admin apakah sudah dibuat" — verifikasi menyeluruh dashboard admin via browser; perbaiki bug yang ditemukan.

Work Log:
- Konfirmasi dashboard admin SUDAH ada (Task 1): AdminView 1.274 baris, 3 peran (verifikator/editor/pengelola), API admin lengkap.
- QA browser menemukan bug 1 — `/api/admin/session` HTTP 500 `[api] status is not defined`: pola `!sesi || status !== 200` (copy-paste dari route lain yang mendapat `status` dari `wajibPeran()`) diterapkan pada route yang memakai `getSesi()` (tanpa `status`). Efek: restore sesi selalu gagal → reload halaman admin selalu balik ke form login. Fix: `if (!sesi)` saja; curl login→session kini 200.
- QA menemukan bug 2 (kondisi lampau tersembunyi oleh bug 1): state `tab` tidak direset saat ganti akun — logout editor (tab aktif "katalog") lalu login pengelola → panel Katalog milik editor ikut tampil. Server aman (pengelola hanya boleh baca katalog; PATCH tetap editor-only), tapi UX bocor. Fix: `tabAktif` DERIVED dari peran sesi saat render (izin per peran; fallback ke tab awal peran) — tanpa effect tambahan; lolos aturan `react-hooks/set-state-in-effect`.
- Bersihkan 3 sisa label prototipe yang lolos Task 2 (semua di tampilan): "Notifikasi pengajuan (perlu ditinjau)" + catatan "(OD-10)/mock" → netral; heading "Berita (alur persetujuan INV-6)" → "Berita"; catatan PanelAkun "(spesifikasi §4)/Akun demo WAJIB diganti" → netral.
- Verifikasi e2e (browser + curl): login 3 peran; antrean donasi 3 baris; detail DON-DEMO-0001 → keputusan terverifikasi + alasan tersimpan → dialog tutup + daftar refresh; buka bukti privat PDF via route terautentikasi; antrean sewa SEW-DEMO-0001 diajukan→ditinjau; notifikasi tandai dibaca (3→2); kirim-ulang memang kondisional (hanya gagal-kirim); editor 5 tab (Berita/Pengumuman/Statistik/Pengasuh/Katalog) render penuh; pengelola Akun & Peran (3 akun + pemilih peran); regresi ganti akun LULUS (editor→katalog→logout→pengelola → panel Akun, tanpa bocor); situs publik normal; footer sticky; `bun run lint` bersih; dev.log tanpa error.
- Catatan lingkungan: input mouse CDP agent-browser mati setelah beberapa klik (eval/screenshot tetap jalan; restart pun hanya sesaat) — verifikasi interaksi lanjutan memakai klik DOM programatik (event nyata, memicu handler React yang sama); bukan bug aplikasi.

Stage Summary:
- Dashboard admin terkonfirmasi berfungsi penuh untuk 3 peran; 2 bug diperbaiki (session restore 500; kebocoran tab lintas peran) + 3 sisa label prototipe dibersihkan.
- Alur inti terverifikasi browser: antrean→detail→bukti→keputusan ber-alasan (donasi & sewa), notifikasi, CRUD editor, akun pengelola, restore sesi setelah reload.

---
Task ID: 4
Agent: Z.ai Code (utama)
Task: Pisahkan dashboard admin dari situs publik — hapus semua jejak admin dari web publik, jadikan ruang pengurus antarmuka mandiri.

Work Log:
- SiteFooter: hapus tombol "Masuk Ruang Pengurus (dashboard)" + prop `bukaAdmin` — situs publik kini nol tautan admin.
- SiteShell: cabang khusus route admin — `#/admin` dirender LAYAR PENUH TERPISAH (tanpa SiteHeader/SiteFooter, wrapper `min-h-screen` latar khusus #F2F5F3); skip-link & shell publik hanya untuk route publik; hapus callback `keAdmin` + hack `aktif` untuk admin; rapikan import (`siteConfig` tak terpakai dihapus).
- AdminView tidak berubah — sudah mandiri: layar login kartu terpusat + "← Kembali ke situs publik"; dashboard punya identitas "RUANG PENGURUS" + "Lihat situs publik" + "Keluar".
- Verifikasi browser: situs publik (desktop+mobile 390px) bebas kata "pengurus" (yang tersisa hanya halaman publik "Dashboard Informasi & Data Panti" — memang konten publik); `#/admin` → header/footer publik TIDAK dirender, latar rgb(242,245,243), login kartu terpusat; login verifikator → dashboard 3 tab berfungsi; "Lihat situs publik" kembali ke beranda dengan header+footer utuh; tanpa scroll horizontal mobile; footer sticky publik utuh; `bun run lint` bersih; dev.log tanpa error.

Stage Summary:
- Situs publik dan ruang pengurus kini DUA antarmuka terpisah: publik tidak menampilkan jejak admin apa pun; admin hanya dijangkau langsung via `#/admin` (tautan private untuk petugas), tampilan mandiri dengan latar berbeda.
- Kontrak API, skema DB, dan seluruh alur admin tetap utuh; hanya arsitektur tampilan yang dipisah.

---
Task ID: 5
Agent: Z.ai Code (utama)
Task: Rapikan footer & halaman donasi — hapus efek underline navigasi footer, hapus catatan privasi data di footer, hapus keterangan leaderboard donasi.

Work Log:
- SiteFooter: hapus `hover:underline` + `underline-offset-4` dari tombol navigasi footer (kini hover hanya perubahan warna teks).
- SiteFooter: hapus kotak catatan privasi ("Data anak hanya dipublikasikan secara agregat...") beserta ikon ShieldAlert; import ShieldAlert dibuang.
- site.ts: hapus properti `footerCatatan` (tak terpakai lagi).
- DonasiView: hapus keterangan "Daftar publik sesungguhnya hanya akan memuat donatur berstatus terverifikasi yang memberi persetujuan." beserta ikon BadgeCheck; import dibersihkan.
- Verifikasi browser: 6 tombol navigasi footer computed `text-decoration-line: none` (juga saat hover); footer tampil bersih tanpa kotak catatan; halaman Tentang & Donasi tetap berfungsi; leaderboard donasi tetap ada tanpa keterangan; `bun run lint` bersih.

Stage Summary:
- Footer navigasi tanpa underline; dua teks keterangan (catatan privasi footer + keterangan leaderboard) dihapus sesuai permintaan; tidak ada referensi/import menganggur tersisa.

---
Task ID: 6
Agent: Z.ai Code (utama)
Task: Ubah label navigasi & halaman ("Usaha Panti" saja; "Dashboard Informasi & Data Panti" → "Pengurus Panti"), hapus logo Next.js di kiri bawah, hapus teks "Rincian pendidikan: 34 + 56 + 45 + 15 = 150."; jawab pertanyaan responsivitas mobile & keberlanjutan desain.

Work Log:
- site.ts: label navigasi "data" → "Pengurus Panti", label "sewa" → "Usaha Panti" (otomatis ikut berubah di SiteHeader desktop & mobile 2 baris, SiteFooter, dan status aktif nav).
- DataPantiView: eyebrow "Dashboard Informasi & Data Panti" → "Pengurus Panti" (+ komentar file); hapus paragraf "Rincian pendidikan: 34 + 56 + 45 + 15 = 150." (variabel totalPendidikan tetap terpakai di baris Total tabel).
- BerandaView: tombol "Lihat Dashboard Informasi & Data Panti" → "Lihat Pengurus Panti".
- PersewaanView: eyebrow "Usaha Panti / Persewaan" → "Usaha Panti" (+ komentar file).
- next.config.ts: tambah `devIndicators: false` — logo/tombol dev tools Next.js di pojok kiri bawah tidak tampil lagi (verifikasi: bounding rect 0x0, screenshot kiri bawah bersih); dev server di-restart agar konfigurasi berlaku.
- QA responsivitas mobile (agent-browser): viewport 390×844 dan 320×568, keenam halaman (beranda/tentang/informasi/data/donasi/sewa) scrollWidth === innerWidth (NOL scroll horizontal); nav mobile 2 baris 3×2 dengan label baru; footer sticky menempel bawah; screenshot visual beranda/data/sewa/footer bersih.
- Catatan: Task 5 (hapus underline nav footer + 2 teks privasi) ternyata sudah tuntas dan tercatat di entri sebelumnya; diverifikasi ulang — footer tanpa underline, teks tidak ada di codebase.
- `bun run lint` bersih; dev.log hanya request 200 tanpa error runtime; grep final: nol sisa "Dashboard Informasi"/"Usaha Panti/Persewaan"/"Rincian pendidikan".

Stage Summary:
- Label baru "Pengurus Panti" & "Usaha Panti" konsisten di header, footer, dan tiap halaman; teks rincian pendidikan & logo dev Next.js dihapus.
- Responsivitas mobile terkonfirmasi: 6 halaman × 2 viewport (390/320) tanpa overflow horizontal, nav & footer rapi.
- Desain tersimpan permanen di kode (Tailwind di JSX + token globals.css + font layout.tsx + foto public/images) — tidak akan hilang saat dijalankan/deploy, tanpa perlu ditambahkan ulang manual.

---
Task ID: 7
Agent: Z.ai Code (utama)
Task: Rebranding "LKSA Danukusumo" (hapus "/ PAYM"), hapus bagian "Alokasi penggunaan dana" + grafiknya, pastikan kode mudah dijalankan (portabilitas DB + skrip setup + README), siapkan saran hosting/database.

Work Log:
- Rebranding 6 lokasi: siteConfig.namaLembaga → "LKSA Danukusumo" (otomatis merambat header/footer/admin), metadata layout.tsx (title+description), h1 TentangView, komentar globals.css & prisma/schema.prisma. Grep final: nol sisa "PAYM" di src & prisma.
- DataPantiView: hapus seluruh section "Alokasi penggunaan dana" (PieChart + tabel + catatan); bersihkan import recharts (Pie/PieChart/Cell/Legend), ikon PieIcon, konstanta WARNA, variabel alokasi/totalAlokasi, tipe `alokasi` di StatsItem & `persen` di Kelompok. Halaman kini: Usia → Pendidikan → Direktori pengasuh.
- Portabilitas: .env DATABASE_URL dari path absolut → `file:../db/custom.db` (relatif terhadap prisma/, menunjuk file db yang sama — data utuh; `bun run db:push` terverifikasi in-sync).
- package.json: rename paket → "lksa-danukusumo-website"; tambah skrip `setup` (prisma generate + db push + seed) dan `db:seed`.
- README.md baru (panduan menjalankan): 3 langkah (install → setup → dev), tabel perintah, akun demo, struktur folder, checklist pra-produksi, catatan deploy singkat (Vercel + Supabase/Neon).
- Verifikasi browser: judul tab & header "LKSA Danukusumo — Purworejo"; 6 halaman publik bebas "PAYM" & bebas "Alokasi penggunaan dana"; layout halaman data utuh; login verifikator → dashboard RUANG PENGURUS sukses; `bun run lint` bersih; dev.log tanpa error.

Stage Summary:
- Identitas situs kini konsisten "LKSA Danukusumo" di seluruh tampilan, metadata, dan komentar kode.
- Halaman Pengurus Panti tampil tanpa bagian alokasi dana; kode recharts terpakai minimal (bar chart saja).
- Proyek portabel: DB relatif, satu perintah `bun run setup`, README lengkap — bisa dijalankan siapa pun dengan `bun install && bun run setup && bun run dev`.

---
Task ID: 8
Agent: Z.ai Code (utama)
Task: Halaman Informasi & Publikasi — ganti filter kategori dengan filter tahun publikasi.

Work Log:
- API /api/articles: param `category` diganti `year` (regex ^\d{4}$); filter publishedAt dengan batas tahun zona WIB (gte 1 Jan +07:00, lt 1 Jan tahun berikut +07:00); respons `categories` → `years` (daftar tahun unik artikel terbit, urut menurun, dihitung dari publishedAt +7 jam).
- InformasiView: state kategori → tahun; dropdown "Kategori" → "Tahun publikasi" (opsi "Semua tahun" + tahun tersedia); teks hasil "dalam kategori X" → "pada tahun X"; tombol kosong → "Hapus filter pencarian dan tahun"; perilaku ganti filter → halaman 1 tetap; badge kategori pada kartu & detail TETAP ditampilkan (hanya filter yang diganti, sesuai permintaan).
- prisma/seed.ts: 2 artikel terbit dipindah ke 2025 (Pembagian Perlengkapan → 2025-07-14, Kelas Mengaji Ramadhan → 2025-03-01) agar filter tahun bisa didemokan lintas tahun; 3 isi berita yang masih menyebut "Dashboard Informasi & Data Panti" diperbarui ke "Pengurus Panti"; re-seed db.
- Verifikasi curl: semua=4 berita (years ['2026','2025']); year=2025 → 2; year=2026 → 2; q=mengaji&year=2025 → 1 (kombinasi OK).
- Verifikasi browser: dropdown menampilkan Semua tahun/2026/2025; pilih 2025 → "2 berita ditemukan pada tahun 2025" dengan 2 kartu benar; Hapus filter → 4 kembali; buka detail & "Kembali ke daftar" → filter tetap terjaga; detail berita memuat teks "Pengurus Panti" (tanpa nama lama); mobile 390px tanpa overflow, form tersusun vertikal rapi; `bun run lint` bersih; dev.log tanpa error.

Stage Summary:
- Filter Informasi & Publikasi kini berbasis TAHUN PUBLIKASI (pengganti kategori), bekerja di sisi server (where Prisma), bisa digabung dengan pencarian kata kunci, dan filter tetap terjaga saat kembali dari detail berita.
- Data demo kini mencakup publikasi 2025 & 2026; seluruh teks berita konsisten memakai nama halaman "Pengurus Panti".
