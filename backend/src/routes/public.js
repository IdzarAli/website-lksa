import express from "express";
import { getDb } from "../models/database.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Articles publik
router.get("/articles", async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    "SELECT * FROM articles WHERE status = 'terbit' ORDER BY created_at DESC"
  );
  return res.json({ items: rows });
});

router.get("/articles/:slug", async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    "SELECT * FROM articles WHERE slug = $1 AND status = 'terbit'",
    [req.params.slug]
  );
  if (!rows.length) return res.status(404).json({ error: "Artikel tidak ditemukan" });
  return res.json({ item: rows[0] });
});

// Announcements publik
router.get("/announcements", async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    "SELECT * FROM announcements WHERE status = 'terbit' ORDER BY created_at DESC"
  );
  return res.json({ items: rows });
});

// Stats publik
router.get("/institution-stats", async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    "SELECT * FROM institution_stats ORDER BY created_at DESC LIMIT 1"
  );
  return res.json({ item: rows[0] || null });
});

// Staff publik
router.get("/staff", async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    "SELECT * FROM staff WHERE status = 'terbit' ORDER BY nama"
  );
  return res.json({ items: rows });
});

// Rental items publik
router.get("/rental-items", async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    "SELECT * FROM rental_items WHERE status = 'aktif' ORDER BY nama"
  );
  return res.json({ items: rows });
});

// Donation create publik
router.post("/donation-confirmations", async (req, res) => {
  const { nama, email, wa, nominalRupiah, keterangan, leaderboardConsent } = req.body;
  if (!nama || !email || !wa || !nominalRupiah) {
    return res.status(400).json({ error: "Data wajib diisi" });
  }

  const db = getDb();
  const id = uuidv4();
  const ref = "DON-" + Date.now().toString(36).toUpperCase();
  await db.query(
    "INSERT INTO donation_confirmations (id, referensi, nama, email, wa, nominal_rupiah, keterangan, leaderboard_consent, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draf')",
    [id, ref, nama, email, wa, nominalRupiah, keterangan || null, leaderboardConsent ? true : false]
  );

  return res.json({ id, referensi: ref }, 201);
});

// Rental request publik
router.post("/rental-requests", async (req, res) => {
  const { nama, email, wa, alamat, jadwal, rincianJenis } = req.body;
  if (!nama || !email || !wa || !alamat || !jadwal || !rincianJenis) {
    return res.status(400).json({ error: "Data wajib diisi" });
  }

  const db = getDb();
  const id = uuidv4();
  const ref = "SEW-" + Date.now().toString(36).toUpperCase();
  await db.query(
    "INSERT INTO rental_requests (id, referensi, nama, email, wa, alamat, jadwal, rincian_jenis, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draf')",
    [id, ref, nama, email, wa, alamat, JSON.stringify(jadwal), JSON.stringify(rincianJenis)]
  );

  return res.json({ id, referensi: ref }, 201);
});

export default router;
