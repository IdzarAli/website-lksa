# Website LKSA Danukusumo

Website resmi LKSA Danukusumo (Purworejo, Jawa Tengah): profil lembaga, informasi & publikasi, data agregat panti, konfirmasi donasi, permohonan persewaan, katalog tarif, dan dashboard admin terpusat. Semua pengelolaan konten dan data menggunakan satu akun admin tunggal, dengan fitur unggah foto untuk berita, pengumuman, direktori pengasuh, dan katalog tarif.

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Backend:** Express.js + PostgreSQL (production) / SQLite (development)
- **Satu origin:** Next.js meneruskan `/api/*` ke backend, jadi cookie sesi dan alamat API tetap sama.

---

## Menjalankan (lokal)

Prasyarat: **Node.js >= 20**.

```bash
npm install
npm run dev
```

Frontend berjalan di **http://localhost:3000**, backend Express di **http://localhost:8000**. Untuk masuk Ruang Pengurus buka **http://localhost:3000/#/admin**.

### Akun demo

| Peran | Email | Password |
|-------|-------|----------|
| Admin | admin@paymdanukusumo | admin123 |

> Ganti seluruh akun dan kredensial database sebelum dipakai produksi.

---

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Next.js + Express sekaligus (port 3000 dan 8000) |
| `npm run dev:web` | Hanya frontend Next.js (port 3000) |
| `npm run dev:api` | Hanya backend Express (port 8000) |
| `npm run setup` | Install dependensi backend Express |
| `npm run seed` | Isi data demo (hanya bila tabel masih kosong) |
| `npm run seed:reset` | Hapus data lama lalu isi ulang data demo |
| `npm run test:backend` | Jalankan tes API Express |
| `npm run lint` | ESLint |
| `npm run build` | Build produksi frontend |
| `npm start` | Jalankan hasil build di port 3000 |

---

## Konfigurasi database

Backend Express mendukung dua mode database:

### Development lokal (SQLite)

Kosongkan kredensial PostgreSQL di `backend/.env`:

```env
# Kosongkan DB_HOST, DB_USER, DB_PASSWORD untuk menggunakan SQLite
```

Backend akan otomatis membuat file `backend/data/app.sqlite` dan menggunakan schema SQLite.

### Production (PostgreSQL)

Isi kredensial PostgreSQL di `backend/.env`:

```env
DB_HOST=db.<project-ref>.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=<password>
```

Backend akan otomatis menggunakan PostgreSQL saat kredensial terisi.

---

## Struktur

```
src/                      Frontend Next.js
  app/                    layout, halaman "/", ikon, CSS global
  components/
    site/                 SiteShell, SiteHeader, SiteFooter, LogoMark
    views/                Beranda, Tentang, Donasi, Persewaan, DataPanti, AdminView
  config/site.ts          identitas, kontak, rekening, navigasi
backend/                  Backend Express.js
  src/
    server.js             entry point
    routes/               public.js + admin.js (API endpoints)
    middleware/            session, auth, error
    models/               database.js (PostgreSQL/SQLite dual mode)
  uploads/                 folder upload media
  data/                   SQLite database (development)
public/                   Aset statis (gambar, ilustrasi SVG)
```

Data sensitif (bukti transfer) hanya dapat diakses lewat `GET /api/admin/receipts/{key}` oleh admin.

---

## Fitur utama

- **Dashboard admin terpusat:** satu akun `admin@paymdanukusumo` mengelola seluruh konten dan data.
- **Upload foto:** admin dapat mengunggah foto untuk berita, pengumuman, direktori pengasuh, dan katalog tarif.
- **Ilustrasi SVG:** staf dan kepala pengasuh menggunakan ilustrasi SVG, bukan foto asli.
- **Hero beranda:** foto utama di belakang teks hero dengan overlay gradient transparan.
- **Navbar hijau modern:** header satu baris dengan gradient hijau kantor, responsif mobile.
- **Footer lengkap:** informasi kontak, navigasi, dan copyright centered.
- **Path traversal protection:** keamanan dashboard admin dengan proteksi akses ilegal.
- **Nomor urut:** tabel donasi dan sewa di admin menampilkan nomor 1, 2, 3... berurutan.
- **Dual database mode:** PostgreSQL untuk produksi, SQLite untuk development lokal.

---

## Konfigurasi

Variabel utama di `.env`:

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `BACKEND_API_URL` | `http://localhost:8000` | tujuan proxy `/api/*` Next.js |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | origin yang diizinkan CORS |
| `SESSION_COOKIE_SECURE` | `false` | set `true` bila memakai HTTPS |

### Konfigurasi Express (backend/.env)

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `8000` | Port backend Express |
| `DB_HOST` | - | Kosongkan untuk SQLite lokal |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_NAME` | `postgres` | Nama database |
| `DB_USER` | `postgres` | Username PostgreSQL |
| `DB_PASSWORD` | - | Password PostgreSQL |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Origin yang diizinkan CORS |

---

## Deployment

### Frontend
Deploy ke Vercel, Netlify, atau hosting statis lainnya.

### Backend
Deploy ke Railway, Render, atau platform Node.js lainnya dengan PostgreSQL terpisah (Supabase/Railway).

### Produksi
- Aktifkan HTTPS
- Set `SESSION_COOKIE_SECURE=true`
- Isi `BACKEND_API_URL` dengan URL backend production
- Isi kredensial PostgreSQL di `backend/.env`
- Jalankan backend dengan PM2, Docker, atau platform deployment

---

## Pemecahan masalah

- **Port terpakai:** hentikan proses di port 3000/8000, lalu jalankan ulang `npm run dev`.
- **Express tidak bisa connect:** pastikan `npm run setup` sudah dijalankan dan `backend/.env` sudah dikonfigurasi.
- **Data ingin direset:** hentikan server, lalu jalankan `npm run seed:reset`.
- **Build error:** jalankan `npm run lint` untuk cek error sebelum build.
