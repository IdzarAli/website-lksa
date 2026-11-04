# Panduan Deploy ke GitHub Pages

## Persiapan Repository

1. **Push kode ke GitHub**
   ```bash
   git add .
   git commit -m "feat: prepare for GitHub Pages deployment"
   git push origin main
   ```

2. **Aktifkan GitHub Pages di Repository**
   - Buka repository di GitHub
   - Settings → Pages
   - Source: pilih "GitHub Actions"
   - Custom domain: isi `paymdanukusumo.or.id`
   - Centang "Enforce HTTPS"

3. **Setup GitHub Secrets/Variables**
   - Settings → Secrets and variables → Actions
   - Tambahkan variable:
     - `BACKEND_API_URL`: `https://api.danukusumo.or.id` (atau URL backend production Anda)

## Konfigurasi DNS

Error yang muncul terjadi karena DNS domain belum pointing ke GitHub Pages. Ikuti langkah-langkah berikut:

### Jika menggunakan domain `paymdanukusumo.or.id` (apex domain)

Di panel kontrol domain Anda (tempat membeli domain), tambahkan 4 A records:

| Type | Host/Name | Value/Points to | TTL |
|------|-----------|-----------------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |

Catatan:
- `@` berarti domain apex (tanpa www)
- Jika panel menggunakan `Host` atau `Name`, isi dengan `@` atau kosongkan
- TTL bisa di-set 3600 (1 jam) atau Auto

### Alternatif: menggunakan www

Jika ingin menggunakan `www.paymdanusumo.or.id`:

| Type | Host/Name | Value/Points to | TTL |
|------|-----------|-----------------|-----|
| CNAME | www | <username>.github.io | 3600 |

Kemudian di GitHub Pages settings, ganti custom domain menjadi `www.paymdanusumo.or.id`.

### Verifikasi DNS

Setelah mengubah DNS, verifikasi dengan:
```bash
# Cek A records
nslookup paymdanusumo.or.id

# Harus menampilkan 4 IP GitHub Pages
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153
```

Atau gunakan online tool: https://dnschecker.org/

## Backend Deployment

GitHub Pages hanya untuk frontend statis. Backend Express harus di-deploy terpisah:

### Opsi 1: Railway
1. Buat akun Railway
2. New Project → Deploy from GitHub
3. Pilih repository ini
4. Root directory: `backend`
5. Add PostgreSQL plugin
6. Set environment variables:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (dari PostgreSQL plugin)
   - `PORT`: 8000
   - `FRONTEND_ORIGIN`: `https://paymdanusumo.or.id`
7. Deploy

### Opsi 2: Render
1. Buat akun Render
2. New → Web Service
3. Connect repository
4. Root directory: `backend`
5. Build command: `npm install`
6. Start command: `node src/server.js`
7. Add PostgreSQL database
8. Set environment variables

### Opsi 3: VPS/DigitalOcean
1. Setup VPS dengan Node.js
2. Clone repository
3. Install dependencies di folder `backend`
4. Setup PostgreSQL
5. Configure `.env`
6. Run dengan PM2: `pm2 start src/server.js --name lksa-backend`

## Konfigurasi CORS

Pastikan backend mengizinkan origin dari GitHub Pages:

Di `backend/.env`:
```env
FRONTEND_ORIGIN=https://paymdanusumo.or.id
```

Di `backend/src/server.js`, CORS sudah dikonfigurasi untuk membaca `FRONTEND_ORIGIN`.

## Testing

Setelah deploy:

1. **Frontend**: Buka `https://paymdanusumo.or.id`
2. **Backend Health**: Buka `https://<backend-url>/health`
3. **Admin**: Buka `https://paymdanusumo.or.id/#/admin`
4. **API Test**: 
   ```bash
   curl https://paymdanusumo.or.id/api/articles
   curl https://paymdanusumo.or.id/api/institution-stats
   ```

## Troubleshooting

### "Domain's DNS record could not be retrieved"
- DNS belum propagasi. Tunggu 1-24 jam
- Verifikasi A records sudah benar di panel domain
- Cek dengan `nslookup paymdanusumo.or.id`

### "Invalid DNSError"
- Pastikan tidak ada CNAME dan A records yang konflik
- Hapus semua record lama untuk domain tersebut
- Tambahkan 4 A records baru

### "ERR_CONNECTION_REFUSED" pada API
- Pastikan backend sudah di-deploy dan berjalan
- Cek `BACKEND_API_URL` di GitHub Actions sudah benar
- Verifikasi CORS di backend mengizinkan domain GitHub Pages

### "Mixed Content" error
- Pastikan frontend dan backend menggunakan HTTPS
- Set `SESSION_COOKIE_SECURE=true` di production

---

## Catatan Penting

1. **GitHub Pages** hanya untuk frontend statis
2. **Backend Express** harus di-deploy terpisah (Railway/Render/VPS)
3. **Database** PostgreSQL harus disiapkan terpisah (Supabase/Railway/Render)
4. **File uploads** disimpan di `backend/uploads/` (tidak di Git)
5. **Environment variables** diset di GitHub Actions dan platform backend

## Arsitektur Production

```
┌─────────────────────────────────────────┐
│   GitHub Pages (Frontend)               │
│   https://paymdanukusumo.or.id          │
│   - Static HTML/CSS/JS                  │
│   - Next.js export                      │
└─────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────┐
│   Railway/Render (Backend)              │
│   https://api.danukusumo.or.id          │
│   - Express.js                          │
│   - PostgreSQL                          │
│   - File uploads                        │
└─────────────────────────────────────────┘
```

Setelah deploy, website Anda akan accessible di `https://paymdanusumo.or.id` dengan backend API di `https://api.danukusumo.or.id`.
