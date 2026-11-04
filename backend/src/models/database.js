import { Client } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Database from "sqlite3";
import fs from "fs";
import path from "path";

let dbInstance = null;
let dbMode = null; // 'pg' | 'sqlite'

function getConnectionString() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || "postgres";
  if (host && user && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return null;
}

function toSqlitePlaceholders(sql) {
  return sql.replace(/\$\d+/g, "?");
}

class PgWrapper {
  constructor(client) {
    this.client = client;
  }
  async query(sql, params = []) {
    const res = await this.client.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount };
  }
  prepare(sql) {
    const wrapped = this;
    return {
      get: (...params) => {
        const sqlWithLimit = sql.replace(/;$/, "") + " LIMIT 1";
        const result = wrapped.client.query(sqlWithLimit, params);
        return result.then((r) => r.rows[0] || null);
      },
      all: (...params) => wrapped.client.query(sql, params).then((r) => r.rows),
      run: (...params) => wrapped.client.query(sql, params).then((r) => ({ changes: r.rowCount })),
    };
  }
}

class SqliteWrapper {
  constructor(db) {
    this.db = db;
  }
  query(sql, params = []) {
    const sqliteSql = toSqlitePlaceholders(sql);
    return new Promise((resolve, reject) => {
      this.db.all(sqliteSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows, rowCount: rows.length });
      });
    });
  }
  prepare(sql) {
    const wrapped = this;
    const sqliteSql = toSqlitePlaceholders(sql);
    const stmt = wrapped.db.prepare(sqliteSql);
    return {
      get: (...params) => new Promise((resolve, reject) => {
        stmt.get(...params, (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        });
      }),
      all: (...params) => new Promise((resolve, reject) => {
        stmt.all(...params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      }),
      run: (...params) => new Promise((resolve, reject) => {
        stmt.run(...params, function (err) {
          if (err) return reject(err);
          resolve({ changes: this.changes });
        });
      }),
    };
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = getConnectionString();
  if (connectionString) {
    const client = new Client({ connectionString });
    dbInstance = new PgWrapper(client);
    dbMode = "pg";
  } else {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, "app.sqlite");
    const db = new Database.Database(dbPath);
    dbInstance = new SqliteWrapper(db);
    dbMode = "sqlite";
  }
  return dbInstance;
}

export function isPg() {
  return dbMode === "pg";
}

const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS django_session (
    session_key TEXT PRIMARY KEY,
    session_data TEXT,
    admin_id TEXT,
    expire_date TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    judul TEXT NOT NULL,
    ringkasan TEXT NOT NULL,
    isi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    media_url TEXT,
    media_alt TEXT,
    publication_consent BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draf',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    prioritas TEXT NOT NULL DEFAULT 'biasa',
    media_url TEXT,
    media_alt TEXT,
    status TEXT NOT NULL DEFAULT 'draf',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS institution_stats (
    id TEXT PRIMARY KEY,
    periode TEXT NOT NULL,
    sumber TEXT NOT NULL,
    usia_agregat TEXT NOT NULL,
    pendidikan_agregat TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    peran TEXT NOT NULL,
    deskripsi TEXT,
    foto TEXT,
    publication_consent BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draf',
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS rental_items (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL,
    satuan TEXT NOT NULL,
    tarif_contoh INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'aktif',
    foto TEXT,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS rental_requests (
    id TEXT PRIMARY KEY,
    referensi TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    wa TEXT NOT NULL,
    alamat TEXT NOT NULL,
    jadwal TEXT NOT NULL,
    rincian_jenis TEXT NOT NULL,
    estimasi_snapshot TEXT,
    status TEXT NOT NULL DEFAULT 'draf',
    item_id TEXT,
    item_nama TEXT,
    item_jenis TEXT,
    keputusan_alasan TEXT,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS donation_confirmations (
    id TEXT PRIMARY KEY,
    referensi TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    wa TEXT NOT NULL,
    nominal_rupiah INTEGER NOT NULL,
    keterangan TEXT,
    receipt_key TEXT,
    leaderboard_consent BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draf',
    verified_by TEXT,
    verified_at TIMESTAMP,
    keputusan_alasan TEXT,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    jenis TEXT NOT NULL,
    referensi TEXT NOT NULL,
    status_entitas TEXT,
    created_at TIMESTAMP DEFAULT now(),
    dibaca BOOLEAN DEFAULT false
  );
  CREATE TABLE IF NOT EXISTS notification_deliveries (
    id TEXT PRIMARY KEY,
    notification_id TEXT NOT NULL,
    kanal TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'terkirim',
    percobaan INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    aksi TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    perubahan_status TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT now()
  );
`;

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS django_session (
    session_key TEXT PRIMARY KEY,
    session_data TEXT,
    admin_id TEXT,
    expire_date TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    judul TEXT NOT NULL,
    ringkasan TEXT NOT NULL,
    isi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    media_url TEXT,
    media_alt TEXT,
    publication_consent INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draf',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    prioritas TEXT NOT NULL DEFAULT 'biasa',
    media_url TEXT,
    media_alt TEXT,
    status TEXT NOT NULL DEFAULT 'draf',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS institution_stats (
    id TEXT PRIMARY KEY,
    periode TEXT NOT NULL,
    sumber TEXT NOT NULL,
    usia_agregat TEXT NOT NULL,
    pendidikan_agregat TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    peran TEXT NOT NULL,
    deskripsi TEXT,
    foto TEXT,
    publication_consent INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draf',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS rental_items (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL,
    satuan TEXT NOT NULL,
    tarif_contoh INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'aktif',
    foto TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS rental_requests (
    id TEXT PRIMARY KEY,
    referensi TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    wa TEXT NOT NULL,
    alamat TEXT NOT NULL,
    jadwal TEXT NOT NULL,
    rincian_jenis TEXT NOT NULL,
    estimasi_snapshot TEXT,
    status TEXT NOT NULL DEFAULT 'draf',
    item_id TEXT,
    item_nama TEXT,
    item_jenis TEXT,
    keputusan_alasan TEXT,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS donation_confirmations (
    id TEXT PRIMARY KEY,
    referensi TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    wa TEXT NOT NULL,
    nominal_rupiah INTEGER NOT NULL,
    keterangan TEXT,
    receipt_key TEXT,
    leaderboard_consent INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draf',
    verified_by TEXT,
    verified_at TIMESTAMP,
    keputusan_alasan TEXT,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    jenis TEXT NOT NULL,
    referensi TEXT NOT NULL,
    status_entitas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dibaca INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS notification_deliveries (
    id TEXT PRIMARY KEY,
    notification_id TEXT NOT NULL,
    kanal TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'terkirim',
    percobaan INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    aksi TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    perubahan_status TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export async function initDatabase() {
  const db = getDb();
  if (dbMode === "pg") {
    await db.client.connect();
    await db.query(PG_SCHEMA);
  } else {
    await new Promise((resolve, reject) => {
      db.db.exec(SQLITE_SCHEMA, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  const existing = await db.query("SELECT id FROM admin_users WHERE email = $1", ["admin@paymdanukusumo"]);
  const rows = existing.rows;
  if (!rows || rows.length === 0) {
    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync("admin123", 10);
    await db.query(
      "INSERT INTO admin_users (id, email, password_hash, nama, role) VALUES ($1, $2, $3, $4, $5)",
      [id, "admin@paymdanukusumo", hash, "Admin LKSA Danukusumo", "admin"]
    );
  }
}
