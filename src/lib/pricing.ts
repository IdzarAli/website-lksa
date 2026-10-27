/**
 * Aturan hitung persewaan & parsing nominal donasi (spesifikasi §3).
 * FUNGSI MURNI — dipakai ulang di browser (ringkasan estimasi) dan di server
 * (hitung ulang otoritatif; total dari browser TIDAK dipercaya).
 *
 * Vektor wajib (spesifikasi §3 / PRD-020..022):
 *  - Aula : 500.000 (1 ruang × 1 sesi 8 jam) + sound 150.000 + kebersihan 50.000 = Rp700.000
 *  - Kursi: 40 unit × 2 hari × 5.000                              = Rp400.000
 *  - Pindah jenis aula → kursi/tenda: tambahan aula TIDAK IKUT
 *  - Pendidikan: 34+56+45+15 = 150 ; Alokasi: 45+30+15+10 = 100%
 * Tarif adalah CONTOH (OD-05) — nilai tarif diambil dari data RentalItem.
 */

export type JenisSewa = "aula" | "kursi" | "tenda";

export interface TambahanAula {
  nama: string;
  tarif: number;
  wajib?: boolean;
}

export interface InputEstimasiAula {
  jenis: "aula";
  jumlahSesi: number; // bilangan bulat positif; 1 hari = 1 sesi 8 jam
  tarifAula: number; // per sesi
  tambahanAula: TambahanAula[]; // ikut tarif per sesi
}

export interface InputEstimasiUnitHarian {
  jenis: "kursi" | "tenda";
  jumlahUnit: number; // bilangan bulat positif
  jumlahHari: number; // bilangan bulat positif
  tarifPerUnitPerHari: number;
}

export type InputEstimasi = InputEstimasiAula | InputEstimasiUnitHarian;

export interface RincianEstimasi {
  label: string;
  jumlah: number;
}

export interface HasilEstimasi {
  jenis: JenisSewa;
  rincian: RincianEstimasi[];
  total: number;
}

export class KesalahanEstimasi extends Error {}

function pastikanBulatPositif(n: number, nama: string): void {
  if (!Number.isInteger(n) || n <= 0) {
    throw new KesalahanEstimasi(`${nama} harus bilangan bulat positif`);
  }
  if (n > 1_000_000) {
    throw new KesalahanEstimasi(`${nama} melebihi batas wajar`);
  }
}

/**
 * Hitung estimasi sewa. Melempar KesalahanEstimasi bila masukan tidak sah.
 * Untuk kursi/tenda, tambahan aula otomatis TIDAK dihitung (PRD-022) karena
 * cabang jenis hanya membaca masukan miliknya masing-masing.
 */
export function hitungEstimasi(input: InputEstimasi): HasilEstimasi {
  if (input.jenis === "aula") {
    pastikanBulatPositif(input.jumlahSesi, "Jumlah sesi");
    pastikanBulatPositif(input.tarifAula, "Tarif aula");
    const rincian: RincianEstimasi[] = [];
    const sesiLabel = input.jumlahSesi === 1 ? "1 sesi 8 jam" : `${input.jumlahSesi} sesi 8 jam`;
    rincian.push({ label: `Aula (${sesiLabel})`, jumlah: input.tarifAula * input.jumlahSesi });
    for (const t of input.tambahanAula) {
      pastikanBulatPositif(t.tarif, `Tarif tambahan ${t.nama}`);
      rincian.push({ label: t.nama, jumlah: t.tarif * input.jumlahSesi });
    }
    const total = rincian.reduce((acc, r) => acc + r.jumlah, 0);
    return { jenis: "aula", rincian, total };
  }

  // kursi / tenda — tambahan aula TIDAK IKUT (PRD-022)
  pastikanBulatPositif(input.jumlahUnit, "Jumlah unit");
  pastikanBulatPositif(input.jumlahHari, "Jumlah hari");
  pastikanBulatPositif(input.tarifPerUnitPerHari, "Tarif per unit per hari");
  const subtotal = input.jumlahUnit * input.jumlahHari * input.tarifPerUnitPerHari;
  return {
    jenis: input.jenis,
    rincian: [
      {
        label: `${input.jumlahUnit} unit × ${input.jumlahHari} hari × ${formatRupiah(input.tarifPerUnitPerHari)}`,
        jumlah: subtotal,
      },
    ],
    total: subtotal,
  };
}

/**
 * Parse nominal donasi ke integer rupiah.
 * "Rp500.000" → 500000 ; "500000" → 500000 ; "Rp 500.000" → 500000
 * Menolak (kembalikan null): kosong, nol, negatif, pecahan ("500.5", "500,5"),
 * huruf acak, pemisah aneh. (PRD-014)
 */
export function parseNominalRupiah(input: string): number | null {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (s.length === 0 || s.length > 20) return null;
  s = s.replace(/^rp/i, "").replace(/\s+/g, "");
  if (s.length === 0) return null;
  // pecahan: mengandung koma → tolak
  if (s.includes(",")) return null;
  // format: 500000 ATAU 500.000 (titik = pemisah ribuan)
  const polaRibuan = /^\d{1,3}(\.\d{3})+$/;
  const polaPolos = /^\d+$/;
  let digit: string;
  if (polaRibuan.test(s)) {
    digit = s.replace(/\./g, "");
  } else if (polaPolos.test(s)) {
    // polos: tidak boleh punya nol depan aneh (mis. "00500")
    if (s.length > 1 && s.startsWith("0")) return null;
    digit = s;
  } else {
    return null;
  }
  const nilai = Number.parseInt(digit, 10);
  if (!Number.isSafeInteger(nilai) || nilai <= 0) return null;
  return nilai;
}

/**
 * Jumlah hari inklusif dari rentang tanggal ISO "YYYY-MM-DD".
 * Selesai < mulai → null (ditolak). Tanggal tidak valid → null.
 */
export function jumlahHariInklusif(mulai: string, selesai: string): number | null {
  const pola = /^\d{4}-\d{2}-\d{2}$/;
  if (!pola.test(mulai) || !pola.test(selesai)) return null;
  const a = new Date(`${mulai}T00:00:00Z`);
  const b = new Date(`${selesai}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  if (a.toISOString().slice(0, 10) !== mulai || b.toISOString().slice(0, 10) !== selesai) return null;
  if (b.getTime() < a.getTime()) return null;
  const selisihHari = Math.round((b.getTime() - a.getTime()) / 86400000) + 1; // inklusif
  return selisihHari;
}

/** Format angka ke tampilan rupiah, mis. 700000 → "Rp700.000" */
export function formatRupiah(n: number): string {
  if (!Number.isSafeInteger(n) || n < 0) return "—";
  return `Rp${n.toLocaleString("id-ID")}`;
}

/** Format tanggal ISO "YYYY-MM-DD" → "12 Mei 2026" (tanpa dependensi luar). */
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const bulan = NAMA_BULAN[Number.parseInt(mo, 10) - 1] ?? mo;
  return `${Number.parseInt(d, 10)} ${bulan} ${y}`;
}
