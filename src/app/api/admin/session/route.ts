import { amankan, jsonGagal, jsonOk } from "@/lib/api";
import { getSesi } from "@/lib/auth";

/** GET /api/admin/session — sesi aktif atau 401. */
export async function GET() {
  return amankan(async () => {
    const sesi = await getSesi();
    if (!sesi) return jsonGagal(401, "Belum masuk");
    return jsonOk({ nama: sesi.nama, role: sesi.role, email: sesi.email });
  });
}
