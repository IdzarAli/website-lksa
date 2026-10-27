# Paket Vibe Coding — Danukusumo di Z.ai

Paket ini untuk membangun **prototipe** website LKSA/PAYM Danukusumo lewat chat Z.ai (mode Full-Stack/agen web). Berkas ini untuk **kamu** (manusia); berkas `01`–`05` untuk **ditempel ke Z.ai**.

## Yang perlu kamu tahu dulu

- Mode full-stack Z.ai menjalankan proyek di browser dengan stack bawaannya: **Next.js + TypeScript + Tailwind + shadcn/ui + Prisma (SQLite)**. Laporan komunitas menyebut stack ini bersifat tetap dan permintaan library di luar itu diarahkan ke alternatif bawaan. Cek di Z.ai langsung karena fitur bisa berubah.
- Akibatnya **Django dan Supabase tidak bisa dibangun di sini**. Paket ini membangun prototipe full-stack Next.js. Django + Supabase (KP-01, KP-02) tetap menjadi target produksi dan dikerjakan terpisah memakai `danukusumo-opencode/` (lihat langkah 9). Ini dicatat sebagai OD-14 di `02-keputusan.md`.
- Beberapa pratinjau hanya menampilkan satu route (`/`). Jika itu terjadi, navigasi dibangun di satu halaman (lihat Prompt 1).
- **WA, penyimpanan Supabase, pemindaian malware, dan email tidak berjalan nyata.** Semuanya disimulasikan lewat adapter `mock`.
- Hasil model bisa keliru. Periksa setiap tahap dengan checklist "Periksa sendiri" di `05`.

## Isi paket

| Berkas | Fungsi | Cara pakai |
|--------|--------|------------|
| `01-konteks-dan-aturan.md` | Peran agen, invarian, larangan, cara kerja | **Tempel pertama** di percakapan baru |
| `02-keputusan.md` | Keputusan terpilih & terbuka + perilaku sementara | Tempel setelah 01 |
| `03-spesifikasi.md` | Halaman, alur, model Prisma, API, desain | Tempel setelah 02 |
| `04-kualitas.md` | Tes wajib, keamanan, gerbang prototipe | Tempel sebelum Prompt 8 (atau di awal bila konteks cukup) |
| `05-prompt-bertahap.md` | Prompt 0–9 yang dijalankan satu per satu | Salin satu prompt per giliran |

## Langkah

1. Buka Z.ai, mulai **percakapan baru**, aktifkan mode **Full-Stack/agen** (nama tombol bisa berbeda).
2. Kirim isi `01`, lalu `02`, lalu `03` sebagai pesan awal (boleh digabung jadi satu pesan; atau unggah sebagai berkas bila fitur unggah tersedia).
3. Kirim **Prompt 0** dari `05`. Tunggu agen merangkum aturan. Jangan lanjut jika ringkasannya salah (donasi bukan pembayaran, persewaan bukan booking, dan seterusnya).
4. Jalankan **Prompt 1 sampai 8 satu per satu**. Setelah tiap prompt, buka pratinjau, lakukan "Periksa sendiri", baru lanjut.
5. Jika agen lupa aturan atau mulai menambah fitur di luar ruang lingkup, tempel ulang `01` dan sebutkan ID aturan yang dilanggar.
6. Sebelum Prompt 8, kirim `04`.
7. Setelah Prompt 8 lulus, jalankan **Prompt 9** (ringkasan serah-terima dan peta migrasi).
8. Unduh/ekspor kode proyek dan simpan di Git. Simpan juga percakapan.
9. Untuk produksi: pakai `danukusumo-opencode/` di terminal untuk membangun Django + Supabase mengikuti kontrak API di `03`, atau putuskan (OD-14) untuk melanjutkan Next.js full-stack dengan PostgreSQL.

## Aturan emas

- Satu fitur per prompt. Prompt besar membuat model melewatkan aturan.
- **Jangan masukkan data nyata** (nama donatur, nomor WA, bukti transfer asli, foto anak) ke Z.ai. Semua data uji sintetis.
- Jangan tempel kunci API atau kredensial apa pun ke chat.
- Jangan terima saran payment gateway, booking otomatis, atau penayangan data individu anak.
- Tinjau kode sebelum dipakai di produksi, terutama bagian otorisasi, upload, dan notifikasi.
