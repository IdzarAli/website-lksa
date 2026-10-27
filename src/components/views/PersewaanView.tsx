"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Armchair, CalendarDays, Info, MapPin, TentTree, Warehouse, TriangleAlert, Users2 } from "lucide-react";
import { formatRupiah, hitungEstimasi, jumlahHariInklusif, HasilEstimasi } from "@/lib/pricing";

/**
 * Usaha Panti (PRD-015, INV-2):
 * - Katalog CONTOH dari API RentalItem (tarif CONTOH — TODO(OD-05))
 * - Form kondisional: Aula (kegiatan, peserta, jam; 1 hari = 1 sesi 8 jam),
 *   Kursi/tenda (unit, lokasi, hari). Ganti jenis → kolom jenis lain dikosongkan (PRD-022).
 * - Estimasi dihitung di klien (fungsi murni yang sama) dan DIHITUNG ULANG di server;
 *   label "estimasi belum final". Tidak mengunci jadwal, tidak meminta pembayaran.
 * - Sukses: referensi + "menunggu pemeriksaan pengurus" (INV-7).
 */
interface ItemSewa {
  id: string;
  nama: string;
  jenis: "aula" | "kursi" | "tenda";
  satuan: string;
  tarifContoh: number;
  tambahan: { nama: string; tarif: number; wajib?: boolean }[];
}

type Keadaan = "awal" | "memuat" | "gagal" | "berhasil";

const IKON_JENIS = {
  aula: Warehouse,
  kursi: Armchair,
  tenda: TentTree,
} as const;

export function PersewaanView() {
  const [items, setItems] = useState<ItemSewa[]>([]);
  const [jenis, setJenis] = useState<"aula" | "kursi" | "tenda">("aula");
  // Aula
  const [kegiatan, setKegiatan] = useState("");
  const [peserta, setPeserta] = useState("");
  const [jamMulai, setJamMulai] = useState("08.00");
  const [jamSelesai, setJamSelesai] = useState("16.00");
  // Kursi/tenda
  const [unit, setUnit] = useState("");
  const [lokasi, setLokasi] = useState("");
  // Umum
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [penyewa, setPenyewa] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");
  const [tambahan, setTambahan] = useState("");
  const [persetujuan, setPersetujuan] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [keadaan, setKeadaan] = useState<Keadaan>("awal");
  const [referensi, setReferensi] = useState("");
  const [duplikat, setDuplikat] = useState(false);
  const idemKey = useRef<string>(crypto.randomUUID());
  const refs: Record<string, HTMLElement | null> = {};

  useEffect(() => {
    fetch("/api/rental-items")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const itemAktif = items.find((i) => i.jenis === jenis);
  const hari = useMemo(() => (mulai && selesai ? jumlahHariInklusif(mulai, selesai) : null), [mulai, selesai]);

  // ganti jenis → kosongkan kolom milik jenis lain (PRD-022)
  const gantiJenis = (j: "aula" | "kursi" | "tenda") => {
    setJenis(j);
    setKegiatan("");
    setPeserta("");
    setJamMulai("08.00");
    setJamSelesai("16.00");
    setUnit("");
    setLokasi("");
    setErrors({});
  };

  const estimasi: HasilEstimasi | null = useMemo(() => {
    if (!itemAktif || !hari || hari <= 0) return null;
    try {
      if (jenis === "aula") {
        return hitungEstimasi({
          jenis: "aula",
          jumlahSesi: hari,
          tarifAula: itemAktif.tarifContoh,
          tambahanAula: itemAktif.tambahan,
        });
      }
      const u = Number.parseInt(unit, 10);
      if (!Number.isInteger(u) || u <= 0) return null;
      return hitungEstimasi({
        jenis,
        jumlahUnit: u,
        jumlahHari: hari,
        tarifPerUnitPerHari: itemAktif.tarifContoh,
      });
    } catch {
      return null;
    }
  }, [itemAktif, jenis, hari, unit]);

  const inputKelas = (k: string) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus-visible:outline-none ${errors[k] ? "border-cta-500" : "border-input"}`;
  const kaitkanRef = (k: string) => (el: HTMLElement | null) => {
    refs[k] = el;
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keadaan === "memuat") return;

    const er: Record<string, string> = {};
    if (!itemAktif) er.jenis = "Katalog belum termuat; coba lagi";
    if (penyewa.trim().length < 2) er.penyewa = "Nama penyewa wajib diisi";
    const kontakBersih = kontak.replace(/[\s\-().]/g, "");
    const kontakWa = /^\+?\d{8,16}$/.test(kontakBersih);
    const kontakEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(kontak.trim());
    if (!kontakWa && !kontakEmail) er.kontak = "Isi nomor WhatsApp (8–16 digit) atau email yang valid";
    if (alamat.trim().length < 5) er.alamat = "Alamat wajib diisi";
    if (!mulai) er.mulai = "Tanggal mulai wajib diisi";
    if (!selesai) er.selesai = "Tanggal selesai wajib diisi";
    if (mulai && selesai && hari === null) er.selesai = "Tanggal selesai tidak boleh sebelum tanggal mulai";
    if (jenis === "aula") {
      if (kegiatan.trim().length < 3) er.kegiatan = "Nama kegiatan wajib diisi";
      const p = Number.parseInt(peserta, 10);
      if (!Number.isInteger(p) || p <= 0 || p > 500) er.peserta = "Jumlah peserta harus bilangan bulat 1–500";
    } else {
      const u = Number.parseInt(unit, 10);
      if (!Number.isInteger(u) || u <= 0) er.unit = "Jumlah unit harus bilangan bulat positif";
      if (lokasi.trim().length < 3) er.lokasi = "Lokasi pemasangan/pemakaian wajib diisi";
    }
    if (!persetujuan) er.persetujuan = "Persetujuan untuk dihubungi wajib dicentang";
    setErrors(er);
    if (Object.keys(er).length > 0) {
      setKeadaan("gagal");
      refs[Object.keys(er)[0]]?.focus();
      return;
    }

    setKeadaan("memuat");
    try {
      const res = await fetch("/api/rental-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idemKey.current },
        body: JSON.stringify({
          jenis,
          rentalItemId: itemAktif?.id,
          penyewa: penyewa.trim(),
          kontak: kontak.trim(),
          alamat: alamat.trim(),
          tambahan: tambahan.trim(),
          jadwal: { mulai, selesai },
          rincianAula: { kegiatan: kegiatan.trim(), peserta: Number.parseInt(peserta, 10) || 0, jamMulai, jamSelesai },
          rincianUnit: { unit: Number.parseInt(unit, 10) || 0, lokasi: lokasi.trim() },
          persetujuanDihubungi: true,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErrors(d.errors ?? { umum: d.error ?? "Gagal mengirim permohonan" });
        setKeadaan("gagal");
        refs[Object.keys(d.errors ?? { umum: "" })[0]]?.focus();
        return;
      }
      setReferensi(d.referensi);
      setDuplikat(Boolean(d.duplikat));
      setKeadaan("berhasil");
      idemKey.current = crypto.randomUUID();
    } catch {
      setErrors({ umum: "Koneksi gagal. Periksa jaringan lalu coba lagi — isian Anda tetap tersimpan." });
      setKeadaan("gagal");
    }
  };

  if (keadaan === "berhasil") {
    return (
      <main id="konten" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-brand-200 bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" aria-hidden />
          <h1 className="mt-4 text-2xl">Permohonan dikirim. Menunggu pemeriksaan pengurus.</h1>
          <p className="mt-3 text-sm text-body-text">Nomor referensi permohonan Anda:</p>
          <p className="mt-2 rounded-lg bg-brand-50 px-4 py-3 font-mono text-lg font-bold tracking-wide text-brand-800" aria-live="polite">
            {referensi}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-body-text">
            Permohonan Anda belum merupakan booking dan tidak mengunci jadwal. Petugas
            akan menghubungi Anda untuk pemeriksaan lanjutan; tidak ada pembayaran pada tahap ini.
          </p>
          {duplikat && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Permohonan yang sama sudah pernah dikirim — data hanya dicatat satu kali.
            </p>
          )}
          <button
            type="button"
            onClick={() => { setKeadaan("awal"); setErrors({}); }}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Ajukan permohonan lain
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Usaha Panti</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Katalog sewa &amp; permohonan</h1>
      <p className="mt-3 flex max-w-3xl items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm leading-relaxed text-body-text">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <span>
          Halaman ini menerima <strong>permohonan</strong>, bukan booking: jadwal tidak dikunci dan
          tidak ada pembayaran di sini. Pengurus akan menghubungi Anda untuk pemeriksaan lanjutan.
        </span>
      </p>

      {/* ===== KATALOG ===== */}
      <section className="mt-8" aria-labelledby="judul-katalog">
        <h2 id="judul-katalog" className="text-2xl">Katalog</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Katalog belum termuat…</p>}
          {items.map((it) => {
            const Ik = IKON_JENIS[it.jenis] ?? Warehouse;
            const aktif = it.jenis === jenis;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => gantiJenis(it.jenis)}
                aria-pressed={aktif}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  aktif ? "border-brand-600 bg-brand-50" : "border-brand-100 bg-white hover:bg-brand-50/50"
                }`}
              >
                <Ik className={`h-6 w-6 ${aktif ? "text-brand-700" : "text-brand-500"}`} aria-hidden />
                <h3 className="mt-2 text-base font-semibold">{it.nama}</h3>
                <p className="mt-1 text-sm text-body-text">
                  {formatRupiah(it.tarifContoh)} <span className="text-muted-foreground">/ {it.satuan}</span>
                </p>
                {it.jenis === "aula" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    + sound system &amp; kebersihan (lihat rincian tarif)
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* ===== FORM KONDISIONAL ===== */}
        <section className="lg:col-span-3" aria-labelledby="judul-form-sewa">
          <div className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
            <h2 id="judul-form-sewa" className="text-2xl">Formulir permohonan — {jenis === "aula" ? "Aula" : jenis === "kursi" ? "Kursi" : "Tenda"}</h2>
            {errors.umum && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-cta-100 bg-cta-50 p-3 text-sm text-cta-700" role="alert">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {errors.umum}
              </p>
            )}
            <form className="mt-4 space-y-4" onSubmit={kirim} noValidate>
              {/* jadwal — hanya permohonan; tidak mengunci ketersediaan */}
              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-1 text-sm font-semibold">Jadwal (permohonan, bukan booking)</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sew-mulai" className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden />
                      Tanggal mulai <span aria-hidden>*</span>
                    </label>
                    <input id="sew-mulai" type="date" ref={kaitkanRef("mulai") as React.Ref<HTMLInputElement>} value={mulai} onChange={(e) => setMulai(e.target.value)} className={inputKelas("mulai")} aria-invalid={Boolean(errors.mulai)} aria-describedby={errors.mulai ? "sew-mulai-err" : undefined} />
                    {errors.mulai && <p id="sew-mulai-err" className="mt-1 text-xs text-cta-700">{errors.mulai}</p>}
                  </div>
                  <div>
                    <label htmlFor="sew-selesai" className="mb-1 block text-sm font-semibold">Tanggal selesai <span aria-hidden>*</span></label>
                    <input id="sew-selesai" type="date" ref={kaitkanRef("selesai") as React.Ref<HTMLInputElement>} value={selesai} onChange={(e) => setSelesai(e.target.value)} className={inputKelas("selesai")} aria-invalid={Boolean(errors.selesai)} aria-describedby={errors.selesai ? "sew-selesai-err" : undefined} />
                    {errors.selesai && <p id="sew-selesai-err" className="mt-1 text-xs text-cta-700">{errors.selesai}</p>}
                  </div>
                </div>
                {hari !== null && hari > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Durasi: {hari} hari {jenis === "aula" ? `(${hari} sesi 8 jam)` : ""}</p>
                )}
              </fieldset>

              {/* kolom kondisional sesuai jenis */}
              {jenis === "aula" ? (
                <fieldset className="rounded-lg border border-border p-4">
                  <legend className="px-1 text-sm font-semibold">Rincian kegiatan (Aula)</legend>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="sew-keg" className="mb-1 block text-sm font-semibold">Nama kegiatan <span aria-hidden>*</span></label>
                      <input id="sew-keg" ref={kaitkanRef("kegiatan") as React.Ref<HTMLInputElement>} value={kegiatan} onChange={(e) => setKegiatan(e.target.value)} className={inputKelas("kegiatan")} aria-invalid={Boolean(errors.kegiatan)} aria-describedby={errors.kegiatan ? "sew-keg-err" : undefined} maxLength={150} />
                      {errors.kegiatan && <p id="sew-keg-err" className="mt-1 text-xs text-cta-700">{errors.kegiatan}</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="sew-peserta" className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                          <Users2 className="h-4 w-4 text-brand-600" aria-hidden />
                          Jumlah peserta <span aria-hidden>*</span>
                        </label>
                        <input id="sew-peserta" inputMode="numeric" ref={kaitkanRef("peserta") as React.Ref<HTMLInputElement>} value={peserta} onChange={(e) => setPeserta(e.target.value)} className={inputKelas("peserta")} aria-invalid={Boolean(errors.peserta)} aria-describedby={errors.peserta ? "sew-peserta-err" : undefined} maxLength={4} />
                        {errors.peserta && <p id="sew-peserta-err" className="mt-1 text-xs text-cta-700">{errors.peserta}</p>}
                      </div>
                      <div>
                        <label htmlFor="sew-jam-mulai" className="mb-1 block text-sm font-semibold">Jam mulai (WIB)</label>
                        <input id="sew-jam-mulai" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} className={inputKelas("jam")} aria-describedby={errors.jam ? "sew-jam-err" : "sew-jam-help"} maxLength={5} />
                      </div>
                      <div>
                        <label htmlFor="sew-jam-selesai" className="mb-1 block text-sm font-semibold">Jam selesai (WIB)</label>
                        <input id="sew-jam-selesai" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} className={inputKelas("jam")} aria-describedby="sew-jam-help" maxLength={5} />
                      </div>
                    </div>
                    <p id="sew-jam-help" className="text-xs text-muted-foreground">
                      1 hari = 1 sesi penuh 8 jam (contoh 08.00–16.00). Jam di luar itu disesuaikan petugas saat pemeriksaan.
                    </p>
                  </div>
                </fieldset>
              ) : (
                <fieldset className="rounded-lg border border-border p-4">
                  <legend className="px-1 text-sm font-semibold">Rincian unit ({jenis === "kursi" ? "Kursi" : "Tenda"})</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sew-unit" className="mb-1 block text-sm font-semibold">Jumlah unit <span aria-hidden>*</span></label>
                      <input id="sew-unit" inputMode="numeric" ref={kaitkanRef("unit") as React.Ref<HTMLInputElement>} value={unit} onChange={(e) => setUnit(e.target.value)} className={inputKelas("unit")} aria-invalid={Boolean(errors.unit)} aria-describedby={errors.unit ? "sew-unit-err" : undefined} maxLength={5} />
                      {errors.unit && <p id="sew-unit-err" className="mt-1 text-xs text-cta-700">{errors.unit}</p>}
                    </div>
                    <div>
                      <label htmlFor="sew-lokasi" className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                        <MapPin className="h-4 w-4 text-brand-600" aria-hidden />
                        Lokasi pemasangan/pemakaian <span aria-hidden>*</span>
                      </label>
                      <input id="sew-lokasi" ref={kaitkanRef("lokasi") as React.Ref<HTMLInputElement>} value={lokasi} onChange={(e) => setLokasi(e.target.value)} className={inputKelas("lokasi")} aria-invalid={Boolean(errors.lokasi)} aria-describedby={errors.lokasi ? "sew-lok-err" : undefined} maxLength={150} />
                      {errors.lokasi && <p id="sew-lok-err" className="mt-1 text-xs text-cta-700">{errors.lokasi}</p>}
                    </div>
                  </div>
                </fieldset>
              )}

              {/* data penyewa */}
              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-1 text-sm font-semibold">Data penyewa</legend>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="sew-penyewa" className="mb-1 block text-sm font-semibold">Nama penyewa <span aria-hidden>*</span></label>
                    <input id="sew-penyewa" ref={kaitkanRef("penyewa") as React.Ref<HTMLInputElement>} value={penyewa} onChange={(e) => setPenyewa(e.target.value)} className={inputKelas("penyewa")} aria-invalid={Boolean(errors.penyewa)} aria-describedby={errors.penyewa ? "sew-penyewa-err" : undefined} maxLength={120} />
                    {errors.penyewa && <p id="sew-penyewa-err" className="mt-1 text-xs text-cta-700">{errors.penyewa}</p>}
                  </div>
                  <div>
                    <label htmlFor="sew-kontak" className="mb-1 block text-sm font-semibold">Kontak (WhatsApp atau email) <span aria-hidden>*</span></label>
                    <input id="sew-kontak" ref={kaitkanRef("kontak") as React.Ref<HTMLInputElement>} value={kontak} onChange={(e) => setKontak(e.target.value)} className={inputKelas("kontak")} aria-invalid={Boolean(errors.kontak)} aria-describedby={errors.kontak ? "sew-kontak-err" : undefined} maxLength={120} />
                    {errors.kontak && <p id="sew-kontak-err" className="mt-1 text-xs text-cta-700">{errors.kontak}</p>}
                  </div>
                  <div>
                    <label htmlFor="sew-alamat" className="mb-1 block text-sm font-semibold">Alamat <span aria-hidden>*</span></label>
                    <textarea id="sew-alamat" ref={kaitkanRef("alamat") as React.Ref<HTMLTextAreaElement>} value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={2} maxLength={300} className={inputKelas("alamat")} aria-describedby={errors.alamat ? "sew-alamat-err" : undefined} />
                    {errors.alamat && <p id="sew-alamat-err" className="mt-1 text-xs text-cta-700">{errors.alamat}</p>}
                  </div>
                  <div>
                    <label htmlFor="sew-tambahan" className="mb-1 block text-sm font-semibold">Permintaan tambahan (opsional)</label>
                    <textarea id="sew-tambahan" value={tambahan} onChange={(e) => setTambahan(e.target.value)} rows={2} maxLength={500} className={inputKelas("tambahan")} />
                  </div>
                </div>
              </fieldset>

              <div className="flex items-start gap-3">
                <input id="sew-setuju" type="checkbox" checked={persetujuan} onChange={(e) => { setPersetujuan(e.target.checked); setErrors((er) => { const { persetujuan: _p, ...s } = er; return s; }); }} className="mt-1 h-4 w-4" aria-invalid={Boolean(errors.persetujuan)} aria-describedby={errors.persetujuan ? "sew-setuju-err" : undefined} />
                <label htmlFor="sew-setuju" className="text-sm leading-relaxed text-body-text">
                  Saya bersedia <strong>dihubungi petugas</strong> untuk pemeriksaan permohonan ini,
                  memahami bahwa permohonan ini <strong>belum mengunci jadwal</strong> dan{" "}
                  <strong>tidak meminta pembayaran</strong> pada tahap ini. <span aria-hidden>*</span>
                </label>
              </div>
              {errors.persetujuan && <p id="sew-setuju-err" className="text-xs text-cta-700">{errors.persetujuan}</p>}

              <button
                type="submit"
                disabled={keadaan === "memuat"}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {keadaan === "memuat" ? "Mengirim permohonan…" : "Ajukan Persewaan"}
              </button>
            </form>
          </div>
        </section>

        {/* ===== RINGKASAN & ESTIMASI ===== */}
        <aside className="lg:col-span-2" aria-labelledby="judul-estimasi">
          <div className="sticky top-40 rounded-2xl border border-brand-100 bg-white p-5">
            <h2 id="judul-estimasi" className="text-xl">Ringkasan &amp; estimasi biaya</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimasi bersifat awal dan dapat disesuaikan oleh petugas saat pemeriksaan
              permohonan.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Jenis</dt>
                <dd className="text-right font-semibold">{jenis === "aula" ? "Aula" : jenis === "kursi" ? "Kursi" : "Tenda"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Durasi</dt>
                <dd className="text-right font-semibold">{hari && hari > 0 ? `${hari} hari` : "—"}</dd>
              </div>
              {jenis === "aula" && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Peserta</dt>
                  <dd className="text-right font-semibold">{peserta || "—"}</dd>
                </div>
              )}
              {jenis !== "aula" && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Unit</dt>
                  <dd className="text-right font-semibold">{unit || "—"}</dd>
                </div>
              )}
            </dl>

            {estimasi && (
              <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50/60 p-4" aria-live="polite">
                <h3 className="text-sm font-semibold">Rincian tarif</h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {estimasi.rincian.map((r) => (
                    <li key={r.label} className="flex justify-between gap-2">
                      <span className="text-body-text">{r.label}</span>
                      <span className="tabular-nums font-semibold">{formatRupiah(r.jumlah)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-brand-200 pt-3 text-base">
                  <span className="font-semibold">Total estimasi</span>
                  <span className="tabular-nums font-bold text-brand-800">{formatRupiah(estimasi.total)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total adalah estimasi awal; perpindahan jenis sewa otomatis menghapus tambahan
                  aula.
                </p>
              </div>
            )}
            {!estimasi && (
              <p className="mt-4 rounded-lg border border-dashed border-brand-200 p-4 text-sm text-muted-foreground">
                Lengkapi tanggal (dan {jenis === "aula" ? "rincian kegiatan" : "jumlah unit"}) untuk melihat estimasi.
              </p>
            )}
            <p className="mt-4 flex gap-2 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Tidak ada pembayaran atau penarikan dana di website ini. Segala kesepakatan
              lanjutan dilakukan langsung dengan pengurus.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
