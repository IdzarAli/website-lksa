# Website LKSA Danukusumo

Website resmi LKSA Danukusumo (Purworejo, Jawa Tengah): profil lembaga, informasi &
publikasi, data agregat panti, konfirmasi donasi, permohonan persewaan, dan Dashboard
untuk admin. Semua pengelolaan konten dan data kini menggunakan satu akun admin tunggal,
dengan fitur unggah foto untuk berita, pengumuman, direktori pengasuh, dan katalog tarif.

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Backend:** Django 5.2 + SQLite (JSON API, tanpa DRF)
- **Satu origin:** Next.js meneruskan `/api/*` ke Django, jadi cookie sesi dan
  alamat API tetap sama seperti sebelumnya.

---

## Menjalankan (lokal)

Prasyarat: **Node.js ≥ 20** dan **Python ≥ 3.11**.

```bash
npm install        # dependensi frontend
npm run setup      # buat .venv, pasang Django, migrasi, isi data demo
npm run dev        # jalankan Django (:8000) + Next.js (:3000)
```

Buka **http://localhost:3000**. Untuk masuk Ruang Pengurus buka
**http://localhost:3000/#/admin**.

`npm run setup` aman dijalankan ulang: migrasi tidak menghapus data, dan seed
hanya mengisi data demo bila database masih kosong.

### Akun demo

| Peran | Email                          | Password   |
| ----- | ------------------------------ | ---------- |
| Admin | admin@paymdanukusumo           | admin123   |

> Ganti seluruh akun dan `DJANGO_SECRET_KEY` sebelum dipakai produksi.

## Perintah

| Perintah              | Fungsi                                              |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Django + Next.js sekaligus (port 8000 dan 3000)     |
| `npm run dev:api`     | Hanya backend Django                                |
| `npm run dev:web`     | Hanya frontend Next.js                              |
| `npm run setup`       | Siapkan virtualenv, dependensi Python, DB, data demo|
| `npm run seed`        | Isi data demo (hanya bila tabel masih kosong)       |
| `npm run seed:reset`  | Hapus data lama lalu isi ulang data demo            |
| `npm run test:backend`| Jalankan 13 tes API Django                          |
| `npm run lint`        | ESLint                                              |
| `npm run build`       | Build produksi frontend (termasuk TypeScript)       |
| `npm start`           | Jalankan hasil build di port 3000 (Django terpisah)  |

Perintah Django lain dapat dijalankan lewat `node scripts/backend.mjs <perintah>`.
Untuk membuat atau mengganti akun admin tanpa Django admin:

```bash
node scripts/backend.mjs buatadmin --email admin@contoh.id --nama "Admin Lembaga" --role admin
```

Kata sandi diminta secara interaktif (minimal 8 karakter).

## Struktur

```
src/                    Frontend Next.js
  app/                  layout, halaman "/", ikon, CSS global
  components/           SiteShell (navigasi hash), header/footer, views publik & admin
  config/site.ts        identitas, kontak, rekening, navigasi
  lib/pricing.ts        aturan hitung sewa (dipakai klien)
backend/                Backend Django
  manage.py
  lksa_backend/         settings, urls, wsgi/asgi
  panti/                models, serializers, views publik/admin, auth, validasi, tes
  media/                uploads admin (foto berita, pengumuman, pengasuh, katalog)
  storage/receipts/     bukti transfer privat (tidak disajikan sebagai file statis)
scripts/                Setup & runner lintas platform
docs/                   Catatan serah-terima
upload/                 Paket spesifikasi asli (arsip, tidak dipakai saat runtime)
```

Data sensitif (bukti transfer) hanya dapat diakses lewat
`GET /api/admin/receipts/{key}` oleh admin. Folder
`backend/storage/` dan `backend/media/` berada di luar `public/`.

## Fitur baru (terbaru)

- **Upload foto di Dashboard:** admin dapat mengunggah foto untuk berita, pengumuman,
  direktori pengasuh, dan katalog tarif. File disimpan di `backend/media/uploads/` dan
  dilayani melalui endpoint `GET /media/uploads/{namaFile}`.
- **Model `RentalItem.foto`:** kolom `foto` ditambahkan pada model katalog tarif untuk
  menyimpan URL foto item sewa.
- **Hero beranda dengan gambar latar:** foto utama kini berada di belakang teks hero
  dengan overlay gradient transparan, menggantikan layout gambar terpisah di kanan.
- **Navbar hijau modern:** header menggunakan gradient hijau kantor dengan teks putih
  dan CTA donasi yang kontras.
- **Foto statis di halaman publik:** foto kepala pengasuh, staf, dan ilustrasi tidak
  lagi memiliki efek melayang. Efek melayang hanya tersimpan di CSS untuk komponen
  cut-out PNG transparan jika diperlukan di masa depan.

## Konfigurasi

Salin `.env.example` menjadi `.env` bila perlu menyesuaikan. Variabel utama:

| Variabel              | Default                  | Keterangan                          |
| --------------------- | ------------------------ | ----------------------------------- |
| `DJANGO_SECRET_KEY`   | nilai dev                | wajib diganti di produksi           |
| `DJANGO_DEBUG`        | `True`                   | set `False` di produksi             |
| `DJANGO_ALLOWED_HOSTS`| `localhost,127.0.0.1`    | host yang boleh mengakses Django    |
| `DJANGO_API_URL`      | `http://127.0.0.1:8000`  | tujuan proxy `/api/*` Next.js       |
| `SESSION_COOKIE_SECURE`| `False`                 | set `True` bila memakai HTTPS       |
| `NOTIFY_ENABLED`      | `False`                  | kanal WA/email masih mock           |

## Catatan produksi

- Jalankan Django dengan server WSGI/ASGI (mis. Gunicorn/Waitress) dan arahkan
  `DJANGO_API_URL` ke alamat tersebut.
- Aktifkan HTTPS, `DJANGO_DEBUG=False`, `SESSION_COOKIE_SECURE=True`, dan isi
  `DJANGO_ALLOWED_HOSTS` serta `FRONTEND_ORIGIN_HOSTS`.
- SQLite cukup untuk satu server kecil. Untuk trafik lebih besar, pindahkan
  database ke PostgreSQL dan sesuaikan `DATABASES` di
  `backend/lksa_backend/settings.py`.
- Cadangkan `backend/db.sqlite3`, `backend/storage/receipts/`, dan `backend/media/uploads/` secara berkala.

## Pemecahan masalah

- **Port terpakai:** hentikan proses di port 3000/8000, lalu jalankan ulang
  `npm run dev`.
- **`ModuleNotFoundError: django`:** jalankan `npm run setup` (atau
  `.venv\Scripts\python.exe -m pip install -r backend\requirements.txt`).
- **Data ingin direset:** hentikan server, lalu jalankan `npm run seed:reset`.
  Untuk mengosongkan total, hapus `backend/db.sqlite3` dan isi
  `backend/storage/receipts/` serta `backend/media/uploads/`, lalu `npm run setup`.
