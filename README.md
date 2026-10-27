# Website LKSA Danukusumo

Website resmi LKSA Danukusumo (Purworejo, Jawa Tengah) — profil lembaga, informasi & publikasi, data agregat panti, konfirmasi donasi, katalog usaha panti, serta Ruang Pengurus (dashboard admin) untuk verifikator, editor, dan pengelola.

Dibangun dengan **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite)**.

---

## Cara Menjalankan (pengembangan lokal)

> Prasyarat: [Bun](https://bun.sh) ≥ 1.1 (atau Node.js ≥ 20 + npm). SQLite tidak perlu instalasi terpisah.

```bash
# 1. Pasang dependensi
bun install          # atau: npm install

# 2. Siapkan database (buat tabel + isi data awal)
bun run setup        # atau: npm run setup

# 3. Jalankan server pengembangan
bun run dev          # atau: npm run dev
```

Buka **http://localhost:3000** — website tampil utuh beserta datanya.

> Ingin mulai dari data kosong? Jalankan `bun run db:push` saja (tanpa seed), lalu isi data lewat Ruang Pengurus.

## Perintah penting

| Perintah            | Fungsi                                              |
| ------------------- | --------------------------------------------------- |
| `bun run dev`       | Server pengembangan di port 3000                    |
| `bun run setup`     | Generate Prisma Client + buat tabel + seed data     |
| `bun run db:seed`   | Isi ulang data awal (demo)                          |
| `bun run db:push`   | Sinkronkan skema ke database tanpa migrasi          |
| `bun run lint`      | Periksa kualitas kode (ESLint)                      |
| `bun run build`     | Build produksi (standalone)                         |
| `bun run start`     | Jalankan hasil build produksi                       |

## Akun demo Ruang Pengurus

Buka langsung: **http://localhost:3000/#/admin**

| Peran        | Email                              | Password        |
| ------------ | ---------------------------------- | --------------- |
| Verifikator  | verifikator@danukusumo.or.id       | verifikator123  |
| Editor       | editor@danukusumo.or.id            | editor123       |
| Pengelola    | pengelola@danukusumo.or.id         | pengelola123    |

> Ganti seluruh akun demo sebelum dipakai produksi.

## Struktur singkat

```
src/
  app/            Layout, halaman `/`, dan seluruh API route (Route Handlers)
  components/     SiteShell (routing hash), header/footer, dan views per halaman
  config/         siteConfig — identitas, kontak, rekening, navigasi
  lib/            auth (sesi cookie), pricing, status, validation, upload, notify, dll.
prisma/           schema.prisma (11 model) + seed.ts (data awal)
db/               File database SQLite (custom.db)
storage/receipts/ Bukti transfer (PRIVAT — di luar folder publik)
public/images/    Foto tampilan website
```

## Hal yang wajib diganti sebelum produksi

1. **`.env`** — `SESSION_SECRET` (kunci sesi admin) wajib diganti nilai acak baru.
2. **Akun demo** di atas — ganti email/password lewat Ruang Pengurus → Akun & Peran.
3. **Kontak, rekening, QRIS** — perbarui lewat `src/config/site.ts` (satu tempat, terpusat).
4. **Database produksi** — SQLite nyaman untuk demo, tetapi untuk produksi disarankan PostgreSQL (lihat catatan deploy di bawah).

## Catatan deploy singkat

- **Hosting (rekomendasi):** Vercel (paling mulus untuk Next.js), atau Railway/Render/VPS bila ingin server penuh.
- **Database produksi (rekomendasi):** Supabase atau Neon (PostgreSQL gratis tier). Ganti provider Prisma di `prisma/schema.prisma` dari `sqlite` ke `postgresql`, sesuaikan `DATABASE_URL`, lalu `bun run db:push`.
- `output: "standalone"` sudah diaktifkan sehingga hasil build bisa dijalankan di container/VPS apa pun.
