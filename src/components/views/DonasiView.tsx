"use client";

import { useMemo, useRef, useState } from "react";
import { BadgeCheck, CheckCircle2, FileText, HeartHandshake, Info, Landmark, QrCode, TriangleAlert, UploadCloud } from "lucide-react";
import { siteConfig } from "@/config/site";
import { parseNominalRupiah, formatRupiah } from "@/lib/pricing";

/**
 * Donasi (PRD-014, INV-1, INV-7).
 * - Panduan transfer rekening/QRIS dari site.ts (CONTOH — TODO(OD-04))
 * - Form konfirmasi: nama, email, WA, nominal, keterangan, bukti (JPG/PNG/PDF ≤5MB),
 *   persetujuan verifikasi + checkbox TERPISAH opsional leaderboard (default TIDAK dicentang)
 * - Keadaan: awal → memuat ("Mengirim konfirmasi…" & cegah kirim ulang) → gagal
 *   (pesan per kolom + fokus ke masalah pertama, isian aman) → berhasil (referensi)
 * - Pesan sukses HANYA: "Konfirmasi diterima. Menunggu verifikasi pengurus." (INV-7)
 */
type Keadaan = "awal" | "memuat" | "gagal" | "berhasil";

interface FormState {
  nama: string;
  email: string;
  wa: string;
  nominal: string;
  keterangan: string;
}

const FORM_AWAL: FormState = { nama: "", email: "", wa: "", nominal: "", keterangan: "" };

function angkaRapiah(n: number): string {
  return formatRupiah(n);
}

export function DonasiView() {
  const [form, setForm] = useState<FormState>(FORM_AWAL);
  const [berkas, setBerkas] = useState<File | null>(null);
  const [persetujuan, setPersetujuan] = useState(false);
  const [leaderboard, setLeaderboard] = useState(false); // pilihan terpisah, default TIDAK
  const [keadaan, setKeadaan] = useState<Keadaan>("awal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referensi, setReferensi] = useState("");
  const [duplikat, setDuplikat] = useState(false);
  const idemKey = useRef<string>(crypto.randomUUID());
  const refs: Record<string, HTMLElement | null> = {};

  const nominalAngka = useMemo(() => parseNominalRupiah(form.nominal), [form.nominal]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pilihBerkas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setBerkas(f);
    // validasi awal di sisi klien (server memvalidasi ulang sepenuhnya)
    if (f) {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      if (!["jpg", "jpeg", "png", "pdf"].includes(ext)) {
        setErrors((er) => ({ ...er, bukti: "Tipe berkas harus JPG, PNG, atau PDF" }));
        setBerkas(null);
        e.target.value = "";
        return;
      }
      if (f.size > siteConfig.upload.maxUkuranBytes) {
        setErrors((er) => ({ ...er, bukti: "Ukuran berkas melebihi 5 MB" }));
        setBerkas(null);
        e.target.value = "";
        return;
      }
    }
    setErrors((er) => {
      const { bukti: _b, ...sisa } = er;
      return sisa;
    });
  };

  const validasiKlien = (): Record<string, string> => {
    const er: Record<string, string> = {};
    if (form.nama.trim().length < 2) er.nama = "Nama wajib diisi";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = "Format email tidak valid";
    if (!/^\+?\d{8,16}$/.test(form.wa.replace(/[\s\-().]/g, ""))) er.wa = "Nomor WhatsApp hanya berisi 8–16 digit angka";
    if (nominalAngka === null) er.nominal = "Nominal harus bilangan rupiah tanpa pecahan, lebih dari nol (contoh: Rp500.000)";
    if (keteranganLen(form.keterangan) > 500) er.keterangan = "Keterangan maksimal 500 karakter";
    if (!berkas) er.bukti = "Bukti transfer wajib diunggah";
    if (!persetujuan) er.persetujuan = "Persetujuan verifikasi wajib dicentang";
    return er;
  };

  const keteranganLen = (s: string) => s.trim().length;

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keadaan === "memuat") return; // cegah kirim ulang saat memuat
    const er = validasiKlien();
    setErrors(er);
    if (Object.keys(er).length > 0) {
      setKeadaan("gagal");
      const pertama = Object.keys(er)[0];
      refs[pertama]?.focus();
      return;
    }
    setKeadaan("memuat");
    try {
      const fd = new FormData();
      fd.set("nama", form.nama.trim());
      fd.set("email", form.email.trim());
      fd.set("wa", form.wa.replace(/[\s\-().]/g, ""));
      fd.set("nominal", form.nominal.trim());
      fd.set("keterangan", form.keterangan.trim());
      fd.set("persetujuanVerifikasi", "true");
      fd.set("leaderboardConsent", leaderboard ? "true" : "false");
      fd.set("bukti", berkas as File);
      const res = await fetch("/api/donation-confirmations", {
        method: "POST",
        headers: { "Idempotency-Key": idemKey.current },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) {
        setErrors(d.errors ?? { umum: d.error ?? "Gagal mengirim konfirmasi" });
        setKeadaan("gagal");
        const pertama = Object.keys(d.errors ?? { umum: "" })[0];
        refs[pertama]?.focus();
        return;
      }
      setReferensi(d.referensi);
      setDuplikat(Boolean(d.duplikat));
      setKeadaan("berhasil");
      idemKey.current = crypto.randomUUID(); // kunci baru untuk donasi berikutnya
    } catch {
      setErrors({ umum: "Koneksi gagal. Periksa jaringan lalu coba lagi — isian Anda tetap tersimpan." });
      setKeadaan("gagal");
    }
  };

  const daftarUlang = () => {
    setKeadaan("awal");
    setErrors({});
  };

  const inputKelas = (k: string) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus-visible:outline-none ${errors[k] ? "border-cta-500" : "border-input"}`;

  const kaitkanRef = (k: string) => (el: HTMLElement | null) => {
    refs[k] = el;
  };

  // ================= BERHASIL =================
  if (keadaan === "berhasil") {
    return (
      <main id="konten" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-brand-200 bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" aria-hidden />
          {/* INV-7: HANYA "diterima / menunggu pemeriksaan" + nomor referensi */}
          <h1 className="mt-4 text-2xl">Konfirmasi diterima. Menunggu verifikasi pengurus.</h1>
          <p className="mt-3 text-sm leading-relaxed text-body-text">
            Nomor referensi Anda:
          </p>
          <p className="mt-2 rounded-lg bg-brand-50 px-4 py-3 font-mono text-lg font-bold tracking-wide text-brand-800" aria-live="polite">
            {referensi}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-body-text">
            Simpan nomor referensi ini. Petugas berwenang akan memeriksa bukti transfer Anda
            secara manual. Pesan ini bukan tanda bahwa donasi telah terverifikasi. Tidak ada
            janji waktu verifikasi.
          </p>
          {duplikat && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Pengajuan yang sama sudah pernah dikirim — data hanya dicatat satu kali.
            </p>
          )}
          <button
            type="button"
            onClick={daftarUlang}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Kirim konfirmasi lain
          </button>
        </div>
      </main>
    );
  }

  // ================= FORM =================
  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cta-600">Donasi</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Panduan transfer &amp; konfirmasi donasi</h1>

      {/* hero angka 150+ (angka dari data lembaga) */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl text-brand-800">150+</span>
          <span className="text-sm text-body-text">anak binaan didampingi lembaga</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* ===== PANDUAN TRANSFER ===== */}
        <section className="lg:col-span-2" aria-labelledby="judul-panduan">
          <h2 id="judul-panduan" className="text-2xl">Langkah berdonasi</h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-body-text">
            <li>1. Transfer ke salah satu rekening resmi lembaga di bawah.</li>
            <li>2. Simpan bukti transfer ( JPG/PNG/PDF, maksimal 5 MB).</li>
            <li>3. Isi formulir konfirmasi di samping dan unggah bukti.</li>
            <li>4. Tunggu pemeriksaan manual oleh petugas berwenang — tanpa janji waktu.</li>
          </ol>
          <p className="mt-3 flex gap-2 rounded-lg border border-brand-200 bg-white p-3 text-xs leading-relaxed text-body-text">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            {siteConfig.donasi.catatanAwal}
          </p>

          <div className="mt-4 space-y-3">
            {siteConfig.donasi.rekening.map((r) => (
              <div key={r.bank} className="rounded-xl border border-brand-100 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Landmark className="h-4 w-4 text-brand-600" aria-hidden />
                  {r.bank}
                </p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wider text-ink">{r.nomor}</p>
                <p className="text-sm text-body-text">a.n. {r.atasNama}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.catatan}</p>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-brand-300 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-brand-600" aria-hidden />
                QRIS
              </p>
              <div className="mt-2 flex aspect-square w-32 items-center justify-center rounded-lg border border-brand-200 bg-white" aria-hidden>
                <QrCode className="h-24 w-24 text-ink" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{siteConfig.donasi.qrisCatatan}</p>
            </div>
          </div>
        </section>

        {/* ===== FORM KONFIRMASI ===== */}
        <section className="lg:col-span-3" aria-labelledby="judul-form">
          <div className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
            <h2 id="judul-form" className="text-2xl">Formulir konfirmasi donasi</h2>
            {errors.umum && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-cta-100 bg-cta-50 p-3 text-sm text-cta-700" role="alert">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {errors.umum}
              </p>
            )}

            <form className="mt-4 space-y-4" onSubmit={kirim} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="don-nama" className="mb-1 block text-sm font-semibold">Nama donatur <span aria-hidden>*</span></label>
                  <input id="don-nama" ref={kaitkanRef("nama") as React.Ref<HTMLInputElement>} value={form.nama} onChange={set("nama")} className={inputKelas("nama")} aria-invalid={Boolean(errors.nama)} aria-describedby={errors.nama ? "don-nama-err" : undefined} maxLength={120} />
                  {errors.nama && <p id="don-nama-err" className="mt-1 text-xs text-cta-700">{errors.nama}</p>}
                </div>
                <div>
                  <label htmlFor="don-email" className="mb-1 block text-sm font-semibold">Email <span aria-hidden>*</span></label>
                  <input id="don-email" type="email" ref={kaitkanRef("email") as React.Ref<HTMLInputElement>} value={form.email} onChange={set("email")} className={inputKelas("email")} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "don-email-err" : undefined} maxLength={120} />
                  {errors.email && <p id="don-email-err" className="mt-1 text-xs text-cta-700">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="don-wa" className="mb-1 block text-sm font-semibold">Nomor WhatsApp <span aria-hidden>*</span></label>
                  <input id="don-wa" inputMode="tel" ref={kaitkanRef("wa") as React.Ref<HTMLInputElement>} value={form.wa} onChange={set("wa")} className={inputKelas("wa")} aria-invalid={Boolean(errors.wa)} aria-describedby={errors.wa ? "don-wa-err" : undefined} maxLength={20} />
                  {errors.wa && <p id="don-wa-err" className="mt-1 text-xs text-cta-700">{errors.wa}</p>}
                </div>
                <div>
                  <label htmlFor="don-nominal" className="mb-1 block text-sm font-semibold">Nominal donasi <span aria-hidden>*</span></label>
                  <input id="don-nominal" inputMode="numeric" ref={kaitkanRef("nominal") as React.Ref<HTMLInputElement>} value={form.nominal} onChange={set("nominal")} placeholder="contoh: Rp500.000" className={inputKelas("nominal")} aria-invalid={Boolean(errors.nominal)} aria-describedby={errors.nominal ? "don-nominal-err" : "don-nominal-help"} maxLength={20} />
                  {errors.nominal ? (
                    <p id="don-nominal-err" className="mt-1 text-xs text-cta-700">{errors.nominal}</p>
                  ) : (
                    <p id="don-nominal-help" className="mt-1 text-xs text-muted-foreground">
                      {nominalAngka !== null ? `Terbaca: ${angkaRapiah(nominalAngka)} (bilangan bulat rupiah)` : "Tulis tanpa pecahan; pemisah ribuan boleh pakai titik."}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="don-ket" className="mb-1 block text-sm font-semibold">Keterangan (opsional)</label>
                <textarea id="don-ket" ref={kaitkanRef("keterangan") as React.Ref<HTMLTextAreaElement>} value={form.keterangan} onChange={set("keterangan")} rows={2} maxLength={500} className={inputKelas("keterangan")} aria-describedby={errors.keterangan ? "don-ket-err" : undefined} />
                {errors.keterangan && <p id="don-ket-err" className="mt-1 text-xs text-cta-700">{errors.keterangan}</p>}
              </div>

              <div>
                <label htmlFor="don-bukti" className="mb-1 block text-sm font-semibold">Bukti transfer (JPG/PNG/PDF, maks 5 MB) <span aria-hidden>*</span></label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                    <UploadCloud className="h-4 w-4" aria-hidden />
                    Pilih berkas
                    <input id="don-bukti" type="file" accept=".jpg,.jpeg,.png,.pdf" ref={kaitkanRef("bukti")} onChange={pilihBerkas} className="sr-only" aria-invalid={Boolean(errors.bukti)} aria-describedby={errors.bukti ? "don-bukti-err" : undefined} />
                  </label>
                  {berkas && (
                    <span className="flex items-center gap-1.5 truncate text-sm text-body-text" aria-live="polite">
                      <FileText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                      {berkas.name} ({Math.ceil(berkas.size / 1024)} KB)
                    </span>
                  )}
                </div>
                {errors.bukti && <p id="don-bukti-err" className="mt-1 text-xs text-cta-700" role="alert">{errors.bukti}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Bukti hanya dilihat petugas berwenang dan tidak pernah dibuka ke publik.
                </p>
              </div>

              {/* ringkasan mengikuti isian */}
              <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4 text-sm" aria-live="polite">
                <h3 className="font-semibold">Ringkasan pengajuan</h3>
                <ul className="mt-2 space-y-1 text-body-text">
                  <li>Nama: <strong>{form.nama.trim() || "—"}</strong></li>
                  <li>Nominal: <strong>{nominalAngka !== null ? angkaRapiah(nominalAngka) : "—"}</strong></li>
                  <li>Bukti: <strong>{berkas ? berkas.name : "belum dipilih"}</strong></li>
                  <li>Tampil di leaderboard: <strong>{leaderboard ? "ya (permintaan Anda)" : "tidak (default)"}</strong></li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input id="don-setuju" type="checkbox" checked={persetujuan} onChange={(e) => { setPersetujuan(e.target.checked); setErrors((er) => { const { persetujuan: _p, ...s } = er; return s; }); }} className="mt-1 h-4 w-4" aria-invalid={Boolean(errors.persetujuan)} aria-describedby={errors.persetujuan ? "don-setuju-err" : undefined} />
                  <label htmlFor="don-setuju" className="text-sm leading-relaxed text-body-text">
                    Saya setuju bukti transfer ini <strong>diperiksa manual</strong> oleh petugas
                    berwenang, dan memahami pesan yang saya terima hanya menyatakan
                    &ldquo;diterima, menunggu pemeriksaan&rdquo; — bukan terverifikasi. <span aria-hidden>*</span>
                  </label>
                </div>
                {errors.persetujuan && <p id="don-setuju-err" className="text-xs text-cta-700">{errors.persetujuan}</p>}

                <div className="flex items-start gap-3">
                  <input id="don-leaderboard" type="checkbox" checked={leaderboard} onChange={(e) => setLeaderboard(e.target.checked)} className="mt-1 h-4 w-4" />
                  <label htmlFor="don-leaderboard" className="text-sm leading-relaxed text-body-text">
                    (Opsional, terpisah) Saya bersedia nama saya ditampilkan pada daftar donatur
                    ilustratif. <strong>Default: tidak ditampilkan.</strong>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={keadaan === "memuat"}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-cta-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HeartHandshake className="h-4 w-4" aria-hidden />
                {keadaan === "memuat" ? "Mengirim konfirmasi…" : "Kirim Konfirmasi Donasi"}
              </button>
              {keadaan === "memuat" && (
                <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                  Mohon tunggu; tombol dinonaktifkan untuk mencegah pengiriman ganda.
                </p>
              )}
            </form>
          </div>

          {/* leaderboard ilustratif */}
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5">
            <h2 className="text-xl">Daftar donatur ilustratif</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Nama hanya ditampilkan bila donatur memberikan persetujuan pada formulir;
              secara bawaan tidak dipublikasikan.
            </p>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">Tabel daftar donatur ilustrasi</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-2 font-semibold">Nama</th>
                  <th scope="col" className="py-2 text-right font-semibold">Nominal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="py-2">Hamba Allah</td>
                  <td className="py-2 text-right tabular-nums">Rp1.000.000</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2">Alumni Angkatan 2010</td>
                  <td className="py-2 text-right tabular-nums">Rp1.500.000</td>
                </tr>
                <tr>
                  <td className="py-2">Keluarga Sakinah</td>
                  <td className="py-2 text-right tabular-nums">Rp750.000</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              Daftar publik sesungguhnya hanya akan memuat donatur berstatus terverifikasi yang memberi persetujuan.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
