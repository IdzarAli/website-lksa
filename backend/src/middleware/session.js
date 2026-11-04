import { getDb } from "../models/database.js";

export async function sessionMiddleware(req, res, next) {
  const sessionId = req.cookies?.danukusumo_sesi;
  if (!sessionId) {
    req.admin = null;
    return next();
  }

  const db = getDb();
  const session = await db.prepare(
    "SELECT admin_id FROM django_session WHERE session_key = $1 AND expire_date > CURRENT_TIMESTAMP"
  ).get(sessionId);
  if (!session) {
    req.admin = null;
    return next();
  }

  const admin = await db.prepare(
    "SELECT id, email, nama, role FROM admin_users WHERE id = $1"
  ).get(session.admin_id);
  req.admin = admin || null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ error: "Harus masuk terlebih dahulu" });
  }
  next();
}
