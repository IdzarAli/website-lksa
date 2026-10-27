/**
 * Mesin status manual (spesifikasi §5). Transisi lain DITOLAK server (INV-5).
 * "disetujui"/"terverifikasi" selalu = keputusan manusia yang tercatat.
 */

// Donasi: menunggu-verifikasi → terverifikasi | perlu-perbaikan | ditolak
export const TRANSISI_DONASI: Record<string, readonly string[]> = {
  "menunggu-verifikasi": ["terverifikasi", "perlu-perbaikan", "ditolak"],
};

// Persewaan: diajukan → ditinjau → disetujui | perlu-perbaikan | ditolak
export const TRANSISI_PERSEWAAN: Record<string, readonly string[]> = {
  diajukan: ["ditinjau"],
  ditinjau: ["disetujui", "perlu-perbaikan", "ditolak"],
};

export function bolehTransisi(tabel: Record<string, readonly string[]>, dari: string, ke: string): boolean {
  const target = tabel[dari];
  return Array.isArray(target) && target.includes(ke);
}

// Status konten (Article/Announcement/Staff/RentalItem): draf | menunggu-persetujuan | terbit | ditarik
export const TRANSISI_KONTEN: Record<string, readonly string[]> = {
  draf: ["menunggu-persetujuan"],
  "menunggu-persetujuan": ["terbit", "draf"],
  terbit: ["ditarik"],
  ditarik: ["draf"],
};

export const LABEL_STATUS: Record<string, string> = {
  // donasi
  "menunggu-verifikasi": "Menunggu verifikasi",
  terverifikasi: "Terverifikasi",
  "perlu-perbaikan": "Perlu perbaikan",
  ditolak: "Ditolak",
  // persewaan
  diajukan: "Diajukan",
  ditinjau: "Ditinjau",
  disetujui: "Disetujui",
  // konten
  draf: "Draf",
  "menunggu-persetujuan": "Menunggu persetujuan",
  terbit: "Terbit",
  ditarik: "Ditarik",
};
