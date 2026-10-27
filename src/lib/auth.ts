import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Sesi admin prototipe (OD-09, OD-12).
 *
 * CATATAN DESAIN: spesifikasi menyebut NextAuth (credentials); pada prototipe
 * satu-route ini dipakai sesi cookie httpOnly bertanda-tangan HMAC dengan
 * peran dicek DI SERVER pada setiap route admin (INV-5, INV-8). Kontrak
 * (login → cookie sesi; peran editor/verifikator/pengelola) dipertahankan
 * agar mudah dipindah ke Django/NextAuth penuh saat produksi.
 * Akun demo sintetis — WAJIB GANTI SEBELUM PRODUKSI.
 */

export type PeranAdmin = "editor" | "verifikator" | "pengelola";

export interface SesiAdmin {
  uid: string;
  email: string;
  nama: string;
  role: PeranAdmin;
  exp: number; // epoch ms
}

export const COOKIE_SESI = "danukusumo_sesi";
const MASA_AKTIF_MS = 4 * 60 * 60 * 1000; // 4 jam

function rahasia(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    // prototipe: tanpa kunci env, sesi ditolak agar tidak ada rahasia yang di-hardcode di kode
    throw new Error("SESSION_SECRET belum diatur (.env)");
  }
  return s;
}

function tanda(payloadB64: string): string {
  return createHmac("sha256", rahasia()).update(payloadB64).digest("base64url");
}

export function buatTokenSesi(sesi: Omit<SesiAdmin, "exp">): string {
  const penuh: SesiAdmin = { ...sesi, exp: Date.now() + MASA_AKTIF_MS };
  const payloadB64 = Buffer.from(JSON.stringify(penuh)).toString("base64url");
  return `${payloadB64}.${tanda(payloadB64)}`;
}

export function verifikasiToken(token: string | undefined | null): SesiAdmin | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const harapan = Buffer.from(tanda(payloadB64));
  const diberi = Buffer.from(sig);
  if (harapan.length !== diberi.length || !timingSafeEqual(harapan, diberi)) return null;
  try {
    const sesi = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SesiAdmin;
    if (!sesi?.uid || !sesi?.role || !sesi?.exp) return null;
    if (sesi.exp < Date.now()) return null;
    if (!["editor", "verifikator", "pengelola"].includes(sesi.role)) return null;
    return sesi;
  } catch {
    return null;
  }
}

/** Ambil sesi dari cookie server (route handlers / server components). */
export async function getSesi(): Promise<SesiAdmin | null> {
  const store = await cookies();
  return verifikasiToken(store.get(COOKIE_SESI)?.value);
}

export interface HasilOtorisasi {
  sesi: SesiAdmin | null;
  status: number; // 401 tanpa sesi, 403 peran tidak sesuai
}

/** Wajib login; peran opsional dibatasi. Pengecekan DI SERVER. */
export async function wajibPeran(peran: PeranAdmin[]): Promise<HasilOtorisasi> {
  const sesi = await getSesi();
  if (!sesi) return { sesi: null, status: 401 };
  if (peran.length > 0 && !peran.includes(sesi.role)) return { sesi, status: 403 };
  return { sesi, status: 200 };
}

export const OPSI_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MASA_AKTIF_MS / 1000,
};
