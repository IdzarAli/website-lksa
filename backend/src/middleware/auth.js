import { getDb } from "../models/database.js";

export function adminOnly(req, res, next) {
  const admin = req.admin;
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Peran Anda tidak berwenang" });
  }
  next();
}
