import { jsonOk } from "@/lib/api";
import { COOKIE_SESI } from "@/lib/auth";

/** POST /api/admin/logout — hapus cookie sesi. */
export async function POST() {
  const res = jsonOk({ ok: true });
  res.cookies.set(COOKIE_SESI, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
