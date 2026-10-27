import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { buatTokenSesi, COOKIE_SESI, OPSI_COOKIE } from "@/lib/auth";
import { cekBatasLaju, ipDariRequest } from "@/lib/ratelimit";
import { bersihkanTeks } from "@/lib/validation";

/**
 * POST /api/admin/login — akun demo sintetis (OD-09, OD-12).
 * WAJIB GANTI SEBELUM PRODUKSI. Rate limit ketat untuk mencegah tebakan.
 */
export async function POST(req: NextRequest) {
  return amankan(async () => {
    if (!cekBatasLaju(`login:${ipDariRequest(req)}`, 8, 60_000)) {
      return jsonGagal(429, "Terlalu banyak percobaan. Coba lagi beberapa saat.");
    }
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonGagal(400, "Permintaan tidak valid");
    }
    const email = bersihkanTeks(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return jsonGagal(400, "Email dan password wajib diisi");

    const user = await db.adminUser.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      // pesan sengaja umum (tidak membocorkan mana yang salah)
      return jsonGagal(401, "Email atau password salah");
    }

    const token = buatTokenSesi({ uid: user.id, email: user.email, nama: user.nama, role: user.role as "editor" | "verifikator" | "pengelola" });
    const res = jsonOk({ nama: user.nama, role: user.role, peringatan: "Akun demo — ganti sebelum produksi" });
    res.cookies.set(COOKIE_SESI, token, OPSI_COOKIE);
    return res;
  });
}
