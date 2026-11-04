import express from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../models/database.js";
import { requireAuth } from "../middleware/session.js";
import { adminOnly } from "../middleware/auth.js";
import { sessionMiddleware } from "../middleware/session.js";
import crypto from "crypto";
import path from "path";

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi" });
  }

  const db = getDb();
  const { rows } = await db.query("SELECT id, email, password_hash, nama, role FROM admin_users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email atau password salah" });
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  await db.query(
    "INSERT INTO django_session (session_key, session_data, admin_id, expire_date) VALUES ($1, $2, $3, $4)",
    [sessionId, JSON.stringify({ admin_id: user.id }), user.id, expiresAt]
  );

  res.cookie("danukusumo_sesi", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    maxAge: 4 * 60 * 60 * 1000,
  });

  return res.json({ nama: user.nama, role: user.role, email: user.email });
});

// Logout
router.post("/logout", (req, res) => {
  const sessionId = req.cookies?.danukusumo_sesi;
  if (sessionId) {
    getDb().query("DELETE FROM django_session WHERE session_key = $1", [sessionId]);
  }
  res.clearCookie("danukusumo_sesi");
  return res.json({ ok: true });
});

// Session info
router.get("/session", sessionMiddleware, (req, res) => {
  if (!req.admin) return res.status(401).json({ error: "Belum masuk" });
  return res.json({ nama: req.admin.nama, role: req.admin.role, email: req.admin.email });
});

// Stats
router.get("/stats", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM institution_stats ORDER BY created_at DESC LIMIT 1");
  return res.json({ item: rows[0] || null });
});

router.post("/stats", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { periode, sumber, usiaAgregat, pendidikanAgregat } = req.body;
  if (!periode || !sumber || !Array.isArray(usiaAgregat) || !Array.isArray(pendidikanAgregat)) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db.query(
    "INSERT INTO institution_stats (id, periode, sumber, usia_agregat, pendidikan_agregat) VALUES ($1, $2, $3, $4, $5)",
    [id, periode, sumber, JSON.stringify(usiaAgregat), JSON.stringify(pendidikanAgregat)]
  );

  return res.json({ id, status: "ok" });
});

// Donations
router.get("/donations", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM donation_confirmations ORDER BY created_at DESC");
  return res.json({ items: rows.map((d, i) => ({ ...d, nomor: i + 1 })) });
});

router.patch("/donations/:id/status", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, keputusanAlasan } = req.body;
  if (!["draf", "terima", "tolak", "ditarik"].includes(status)) {
    return res.status(400).json({ error: "Status tidak valid" });
  }

  const db = getDb();
  const { rows } = await db.query("SELECT * FROM donation_confirmations WHERE id = $1", [id]);
  const existing = rows[0];
  if (!existing) return res.status(404).json({ error: "Donasi tidak ditemukan" });

  await db.query("UPDATE donation_confirmations SET status = $1, keputusan_alasan = $2 WHERE id = $3", [status, keputusanAlasan || null, id]);
  return res.json({ id, status });
});

// Rentals
router.get("/rentals", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM rental_requests ORDER BY created_at DESC");
  return res.json({ items: rows.map((s, i) => ({ ...s, nomor: i + 1 })) });
});

router.patch("/rentals/:id/status", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, keputusanAlasan } = req.body;
  if (!["draf", "terima", "tolak", "ditarik"].includes(status)) {
    return res.status(400).json({ error: "Status tidak valid" });
  }

  const db = getDb();
  const { rows } = await db.query("SELECT * FROM rental_requests WHERE id = $1", [id]);
  const existing = rows[0];
  if (!existing) return res.status(404).json({ error: "Sewa tidak ditemukan" });

  await db.query("UPDATE rental_requests SET status = $1, keputusan_alasan = $2 WHERE id = $3", [status, keputusanAlasan || null, id]);
  return res.json({ id, status });
});

// Rental items
router.get("/rental-items", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM rental_items ORDER BY nama");
  return res.json({ items: rows });
});

router.patch("/rental-items/:id", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, nama, tarifContoh } = req.body;

  const db = getDb();
  const { rows } = await db.query("SELECT * FROM rental_items WHERE id = $1", [id]);
  const existing = rows[0];
  if (!existing) return res.status(404).json({ error: "Item tidak ditemukan" });

  const updates = [];
  const values = [];
  if (status) { updates.push("status = $" + (values.length + 1)); values.push(status); }
  if (nama) { updates.push("nama = $" + (values.length + 1)); values.push(nama); }
  if (tarifContoh !== undefined) { updates.push("tarif_contoh = $" + (values.length + 1)); values.push(tarifContoh); }

  if (updates.length) {
    values.push(id);
    await db.query(`UPDATE rental_items SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
  }
  return res.json({ id, status: "ok" });
});

// Articles
router.get("/articles", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM articles ORDER BY created_at DESC");
  return res.json({ items: rows });
});

router.post("/articles", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { judul, ringkasan, isi, kategori, mediaUrl, mediaAlt } = req.body;
  if (!judul || !isi) {
    return res.status(400).json({ error: "Judul dan isi wajib diisi" });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const slug = judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
  await db.query(
    "INSERT INTO articles (id, slug, judul, ringkasan, isi, kategori, media_url, media_alt, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draf')",
    [id, slug, judul, ringkasan || "", isi, kategori || "Kegiatan", mediaUrl || null, mediaAlt || null]
  );

  return res.json({ id, slug, status: "draf" }, 201);
});

router.patch("/articles/:id", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, judul, isi } = req.body;

  const db = getDb();
  const { rows } = await db.query("SELECT * FROM articles WHERE id = $1", [id]);
  const existing = rows[0];
  if (!existing) return res.status(404).json({ error: "Artikel tidak ditemukan" });

  if (status && Object.keys(req.body).length === 1) {
    await db.query("UPDATE articles SET status = $1 WHERE id = $2", [status, id]);
    return res.json({ id, status });
  }

  const updates = [];
  const values = [];
  if (judul) { updates.push("judul = $" + (values.length + 1)); values.push(judul); }
  if (isi) { updates.push("isi = $" + (values.length + 1)); values.push(isi); }
  if (updates.length) {
    values.push(id);
    await db.query(`UPDATE articles SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
  }
  return res.json({ id, status: existing.status });
});

// Announcements
router.get("/announcements", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM announcements ORDER BY created_at DESC");
  return res.json({ items: rows });
});

router.post("/announcements", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { judul, isi, kategori, prioritas } = req.body;
  if (!judul || !isi) {
    return res.status(400).json({ error: "Judul dan isi wajib diisi" });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db.query(
    "INSERT INTO announcements (id, judul, isi, kategori, prioritas, status) VALUES ($1, $2, $3, $4, $5, 'draf')",
    [id, judul, isi, kategori || "Umum", prioritas || "biasa"]
  );

  return res.json({ id, status: "draf" }, 201);
});

router.patch("/announcements/:id", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, judul, isi } = req.body;

  const db = getDb();
  const { rows } = await db.query("SELECT * FROM announcements WHERE id = $1", [id]);
  const existing = rows[0];
  if (!existing) return res.status(404).json({ error: "Pengumuman tidak ditemukan" });

  if (status && Object.keys(req.body).length === 1) {
    await db.query("UPDATE announcements SET status = $1 WHERE id = $2", [status, id]);
    return res.json({ id, status });
  }

  const updates = [];
  const values = [];
  if (judul) { updates.push("judul = $" + (values.length + 1)); values.push(judul); }
  if (isi) { updates.push("isi = $" + (values.length + 1)); values.push(isi); }
  if (updates.length) {
    values.push(id);
    await db.query(`UPDATE announcements SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
  }
  return res.json({ id, status: existing.status });
});

// Staff
router.get("/staff", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM staff ORDER BY nama");
  return res.json({ items: rows });
});

router.post("/staff", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { nama, peran } = req.body;
  if (!nama || !peran) {
    return res.status(400).json({ error: "Nama dan peran wajib diisi" });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db.query("INSERT INTO staff (id, nama, peran, status) VALUES ($1, $2, $3, 'draf')", [id, nama, peran]);
  return res.json({ id }, 201);
});

router.patch("/staff", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id, status } = req.body;
  if (!id) return res.status(400).json({ error: "ID wajib diisi" });

  const db = getDb();
  const { rows } = await db.query("SELECT * FROM staff WHERE id = $1", [id]);
  const existing = rows[0];
  if (!existing) return res.status(404).json({ error: "Pengasuh tidak ditemukan" });

  if (status) await db.query("UPDATE staff SET status = $1 WHERE id = $2", [status, id]);
  return res.json({ id, status: existing.status });
});

// Notifications
router.get("/notifications", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM notifications ORDER BY created_at DESC");
  return res.json({ items: rows });
});

router.post("/notifications/:id/read", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id } = req.params;
  await getDb().query("UPDATE notifications SET dibaca = true WHERE id = $1", [id]);
  return res.json({ ok: true });
});

router.post("/notifications/:id/resend", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { deliveryId } = req.body;
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM notification_deliveries WHERE id = $1 AND notification_id = $2", [deliveryId, id]);
  const delivery = rows[0];
  if (!delivery) return res.status(404).json({ error: "Delivery tidak ditemukan" });

  await db.query("UPDATE notification_deliveries SET status = 'terkirim', percobaan = percobaan + 1 WHERE id = $1", [deliveryId]);
  return res.json({ ok: true, pesan: "Terkirim" });
});

// Upload media
router.post("/upload", sessionMiddleware, requireAuth, adminOnly, (req, res) => {
  // Placeholder: implementasi upload file akan ditambahkan
  return res.status(501).json({ error: "Upload belum diimplementasi" });
});

// Receipts (privet)
router.get("/receipts/:key", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { key } = req.params;
  const db = getDb();
  const { rows } = await db.query("SELECT * FROM donation_confirmations WHERE receipt_key = $1", [key]);
  if (!rows.length) return res.status(404).json({ error: "Bukti tidak ditemukan" });

  const receipt = rows[0];
  const filePath = path.join(process.cwd(), "storage", "receipts", key);
  // Placeholder: return file atau redirect
  return res.json({ receipt });
});

// Users (admin accounts)
router.get("/users", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query("SELECT id, email, nama, role, created_at FROM admin_users ORDER BY created_at DESC");
  return res.json({ items: rows });
});

router.post("/users", sessionMiddleware, requireAuth, adminOnly, async (req, res) => {
  const { email, password, nama, role } = req.body;
  if (!email || !password || !nama) {
    return res.status(400).json({ error: "Email, password, dan nama wajib diisi" });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 10);
  await db.query(
    "INSERT INTO admin_users (id, email, password_hash, nama, role) VALUES ($1, $2, $3, $4, $5)",
    [id, email, hash, nama, role || "admin"]
  );

  return res.json({ id }, 201);
});

export default router;
