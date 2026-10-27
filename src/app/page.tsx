import { SiteShell } from "@/components/SiteShell";

/**
 * Pratinjau hanya menayangkan route "/" — seluruh navigasi publik dibangun
 * sebagai tampilan satu halaman dengan komponen terpisah per "halaman"
 * (siap dipindah ke route App Router saat produksi).
 */
export default function Page() {
  return <SiteShell />;
}
