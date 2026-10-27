"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell, FileText, FolderOpen, Lock, LogOut, Megaphone, RefreshCcw, Send, ShieldCheck,
  Table2, UserCog, Users, Wrench, Download, XCircle, CheckCircle2, ImageIcon,
} from "lucide-react";
import { StatusBadge } from "@/components/site/StatusBadge";
import { LogoMark } from "@/components/site/LogoMark";
import { formatRupiah, formatTanggal } from "@/lib/pricing";

/**
 * Ruang Pengurus (OD-09, OD-12). Peran dicek DI SERVER pada setiap route
 * (klien hanya menyembunyikan/menampilkan menu).
 * Peran: editor (konten) · verifikator (antrean + keputusan) · pengelola (akun).
 * Akun demo sintetis — WAJIB GANTI SEBELUM PRODUKSI.
 */
interface Sesi { nama: string; role: "editor" | "verifikator" | "pengelola"; email: string }
interface Donasi {
  id: string; referensi: string; nama: string; email: string; wa: string;
  nominalRupiah: number; keterangan: string | null; receiptKey: string;
  leaderboardConsent: boolean; status: string; verifiedBy: string | null;
  verifiedAt: string | null; keputusanAlasan: string | null; version: number; createdAt: string;
}
interface Sewa {
  id: string; referensi: string; penyewa: string; kontak: string; alamat: string;
  jadwal: string; rincianJenis: string; estimasiSnapshot: string; status: string;
  keputusanAlasan: string | null; version: number; createdAt: string;
  itemNama: string; itemJenis: string;
}
interface Notifikasi {
  id: string; jenis: string; referensi: string; statusEntitas: string | null;
  createdAt: string; dibaca: boolean;
  deliveries: { id: string; kanal: string; status: string; percobaan: number }[];
}
interface Artikel {
  id: string; slug: string; judul: string; kategori: string; status: string;
  publishedAt: string | null; mediaAlt: string | null; publicationConsent: boolean;
  ringkasan?: string; isi?: string; mediaUrl?: string | null;
}
interface Pengumuman {
  id: string; judul: string; isi: string; kategori: string; prioritas: string; status: string; publishedAt: string | null;
}
interface Pengasuh { id: string; nama: string; peran: string; publicationConsent: boolean; status: string }
interface KatalogItem { id: string; nama: string; jenis: string; satuan: string; tarifContoh: number; status: string }
interface Akun { id: string; email: string; nama: string; role: string }

// mesin status untuk pilihan UI (harus sama dengan server)
const OPSI_STATUS_DONASI: Record<string, string[]> = {
  "menunggu-verifikasi": ["terverifikasi", "perlu-perbaikan", "ditolak"],
};
const OPSI_STATUS_SEWA: Record<string, string[]> = {
  diajukan: ["ditinjau"],
  ditinjau: ["disetujui", "perlu-perbaikan", "ditolak"],
};

export function AdminView({ kembali }: { kembali: () => void }) {
  const [sesi, setSesi] = useState<Sesi | null | undefined>(undefined);
  const [tab, setTab] = useState("antrean-donasi");

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setSesi(d ? { nama: d.nama, role: d.role, email: d.email } : null);
      })
      .catch(() => setSesi(null));
  }, []);

  // tab aktif diturunkan dari peran sesi — panel milik peran lain tak pernah tampil
  const tabAktif = (() => {
    if (!sesi) return tab;
    const izin: Record<Sesi["role"], string[]> = {
      verifikator: ["antrean-donasi", "antrean-sewa", "notifikasi"],
      editor: ["berita", "pengumuman", "statistik", "pengasuh", "katalog"],
      pengelola: ["akun", "notifikasi"],
    };
    const daftar = izin[sesi.role] ?? [];
    return daftar.includes(tab) ? tab : daftar[0] ?? tab;
  })();

  if (sesi === undefined) {
    return (
      <main id="konten" className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Memeriksa sesi…</p>
      </main>
    );
  }
  if (sesi === null) {
    return <FormulirLogin padaSukses={(s) => setSesi(s)} kembali={kembali} />;
  }

  const tabs = [
    ...(sesi.role === "verifikator" ? [
      { key: "antrean-donasi", label: "Antrean Donasi", ikon: Download },
      { key: "antrean-sewa", label: "Antrean Persewaan", ikon: FolderOpen },
      { key: "notifikasi", label: "Notifikasi", ikon: Bell },
    ] : []),
    ...(sesi.role === "editor" ? [
      { key: "berita", label: "Berita", ikon: FileText },
      { key: "pengumuman", label: "Pengumuman", ikon: Megaphone },
      { key: "statistik", label: "Statistik", ikon: Table2 },
      { key: "pengasuh", label: "Pengasuh", ikon: Users },
      { key: "katalog", label: "Katalog & Tarif", ikon: Wrench },
    ] : []),
    ...(sesi.role === "pengelola" ? [
      { key: "akun", label: "Akun & Peran", ikon: UserCog },
      { key: "notifikasi", label: "Notifikasi", ikon: Bell },
    ] : []),
  ];

  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-700">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Ruang Pengurus
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl">{sesi.nama}</h1>
          <p className="text-sm text-muted-foreground">
            Peran: <strong>{sesi.role}</strong> · {sesi.email}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={kembali} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
            Lihat situs publik
          </button>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              setSesi(null);
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-cta-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cta-600"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Keluar
          </button>
        </div>
      </div>

      <p className="mt-3 rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs leading-relaxed text-body-text">
        Hak akses diperiksa ulang di server pada setiap permintaan.
      </p>

      <div role="tablist" aria-label="Menu pengurus" className="mt-4 flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tabAktif === t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tabAktif === t.key ? "bg-brand-600 text-white" : "text-brand-800 hover:bg-brand-50"
            }`}
          >
            <t.ikon className="h-4 w-4" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabAktif === "antrean-donasi" && <AntreanDonasi />}
        {tabAktif === "antrean-sewa" && <AntreanSewa />}
        {tabAktif === "notifikasi" && <PanelNotifikasi />}
        {tabAktif === "berita" && <PanelBerita />}
        {tabAktif === "pengumuman" && <PanelPengumuman />}
        {tabAktif === "statistik" && <PanelStatistik />}
        {tabAktif === "pengasuh" && <PanelPengasuh />}
        {tabAktif === "katalog" && <PanelKatalog />}
        {tabAktif === "akun" && <PanelAkun />}
      </div>
    </main>
  );
}

/* ================= LOGIN ================= */
function FormulirLogin({ padaSukses, kembali }: { padaSukses: (s: Sesi) => void; kembali: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(false);

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemuat(true);
    setGalat("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setGalat(d.error ?? "Gagal masuk");
        return;
      }
      padaSukses({ nama: d.nama, role: d.role, email });
    } catch {
      setGalat("Koneksi gagal");
    } finally {
      setMemuat(false);
    }
  };

  return (
    <main id="konten" className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-6">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-20 w-20" />
          <h1 className="mt-3 flex items-center gap-2 text-2xl">
            <Lock className="h-5 w-5 text-brand-600" aria-hidden />
            Masuk Ruang Pengurus
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Untuk petugas lembaga. Peran menentukan menu yang tersedia.
        </p>
        {galat && (
          <p className="mt-3 rounded-lg border border-cta-100 bg-cta-50 p-3 text-sm text-cta-700" role="alert">{galat}</p>
        )}
        <form className="mt-4 space-y-4" onSubmit={kirim}>
          <div>
            <label htmlFor="adm-email" className="mb-1 block text-sm font-semibold">Email</label>
            <input id="adm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" autoComplete="username" />
          </div>
          <div>
            <label htmlFor="adm-sandi" className="mb-1 block text-sm font-semibold">Password</label>
            <input id="adm-sandi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" autoComplete="current-password" />
          </div>
          <button type="submit" disabled={memuat} className="min-h-[44px] w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {memuat ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
        <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs leading-relaxed text-body-text">
          <strong>Akun demo:</strong>
          <br />editor@danukusumo.or.id / editor123 · verifikator@danukusumo.or.id / verifikator123 · pengelola@danukusumo.or.id / pengelola123
        </div>
        <button type="button" onClick={kembali} className="mt-4 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
          ← Kembali ke situs publik
        </button>
      </div>
    </main>
  );
}

/* ================= ANTREAN DONASI ================= */
function AntreanDonasi() {
  const [items, setItems] = useState<Donasi[] | null>(null);
  const [filter, setFilter] = useState("");
  const [versi, setVersi] = useState(0);
  const [buka, setBuka] = useState<Donasi | null>(null);

  useEffect(() => {
    let aktif = true;
    fetch(`/api/admin/donations${filter ? `?status=${filter}` : ""}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (aktif) setItems(d.items ?? []);
      })
      .catch(() => {
        if (aktif) setItems([]);
      });
    return () => {
      aktif = false;
    };
  }, [filter, versi]);

  const muatData = () => setVersi((v) => v + 1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl">Antrean konfirmasi donasi</h2>
          <p className="text-sm text-muted-foreground">
            Hanya petugas berperan verifikator yang dapat mengubah status; editor ditolak server.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-donasi" className="text-sm font-semibold">Status</label>
          <select id="filter-donasi" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-input px-3 py-2.5 text-sm">
            <option value="">Semua</option>
            <option value="menunggu-verifikasi">Menunggu verifikasi</option>
            <option value="terverifikasi">Terverifikasi</option>
            <option value="perlu-perbaikan">Perlu perbaikan</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <button type="button" onClick={muatData} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted">
            <RefreshCcw className="h-4 w-4" aria-hidden /> Muat ulang
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[32rem] overflow-y-auto scroll-area-thin rounded-xl border border-brand-100">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-brand-50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">Referensi</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Donatur</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Nominal</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items === null && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Memuat…</td></tr>
            )}
            {items !== null && items.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Tidak ada data.</td></tr>
            )}
            {items?.map((d) => (
              <tr key={d.id} className="border-t border-border/60">
                <td className="px-3 py-2.5 font-mono text-xs">{d.referensi}</td>
                <td className="px-3 py-2.5">{d.nama}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatRupiah(d.nominalRupiah)}</td>
                <td className="px-3 py-2.5"><StatusBadge status={d.status} /></td>
                <td className="px-3 py-2.5">
                  <button type="button" onClick={() => setBuka(d)} className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    Buka
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {buka && <DetailDonasi donasi={buka} tutup={() => setBuka(null)} padaBerubah={muatData} />}
    </div>
  );
}

function DetailDonasi({ donasi, tutup, padaBerubah }: { donasi: Donasi; tutup: () => void; padaBerubah: () => void }) {
  const [buktiAda, setBuktiAda] = useState<boolean | null>(null);
  const [statusBaru, setStatusBaru] = useState("");
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(false);

  const opsi = OPSI_STATUS_DONASI[donasi.status] ?? [];

  const keputusan = async () => {
    setGalat("");
    if (!statusBaru) { setGalat("Pilih status tujuan"); return; }
    if (alasan.trim().length < 5) { setGalat("Alasan keputusan wajib diisi (minimal 5 karakter)"); return; }
    setMemuat(true);
    try {
      const res = await fetch(`/api/admin/donations/${donasi.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBaru, alasan: alasan.trim(), version: donasi.version }),
      });
      const d = await res.json();
      if (!res.ok) {
        setGalat(d.errors?.version ?? d.errors?.alasan ?? d.error ?? "Gagal mengubah status");
        return;
      }
      tutup();
      padaBerubah();
    } finally {
      setMemuat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Detail donasi ${donasi.referensi}`}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto scroll-area-thin rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-mono text-lg font-bold">{donasi.referensi}</h3>
            <StatusBadge status={donasi.status} />
          </div>
          <button type="button" onClick={tutup} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted" aria-label="Tutup detail">Tutup</button>
        </div>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Donatur</dt><dd className="font-semibold">{donasi.nama}</dd></div>
          <div><dt className="text-muted-foreground">Kontak</dt><dd>{donasi.email} · {donasi.wa}</dd></div>
          <div><dt className="text-muted-foreground">Nominal</dt><dd className="font-semibold tabular-nums">{formatRupiah(donasi.nominalRupiah)}</dd></div>
          <div><dt className="text-muted-foreground">Keterangan</dt><dd>{donasi.keterangan || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Persetujuan leaderboard</dt><dd>{donasi.leaderboardConsent ? "diminta" : "tidak"}</dd></div>
          <div><dt className="text-muted-foreground">Diterima</dt><dd>{formatTanggal(donasi.createdAt)}</dd></div>
          {donasi.verifiedBy && (
            <>
              <div><dt className="text-muted-foreground">Diputuskan oleh</dt><dd>{donasi.verifiedBy} · {formatTanggal(donasi.verifiedAt)}</dd></div>
              <div><dt className="text-muted-foreground">Alasan</dt><dd>{donasi.keputusanAlasan}</dd></div>
            </>
          )}
        </dl>

        {/* bukti HANYA lewat route terautentikasi (INV-4) */}
        <div className="mt-4 rounded-xl border border-brand-100 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <ImageIcon className="h-4 w-4 text-brand-600" aria-hidden />
            Bukti transfer (privat)
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Kunci berkas: <span className="font-mono">{donasi.receiptKey.slice(0, 18)}…</span> — hanya terbuka lewat route berperan verifikator.
          </p>
          {buktiAda === null && (
            <button
              type="button"
              onClick={() => {
                fetch(`/api/admin/receipts/${donasi.receiptKey}`)
                  .then((r) => setBuktiAda(r.ok))
                  .catch(() => setBuktiAda(false));
              }}
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Download className="h-4 w-4" aria-hidden /> Buka bukti
            </button>
          )}
          {buktiAda === false && <p className="mt-2 text-sm text-cta-700">Bukti tidak dapat dibuka atau bukan berkas gambar/PDF yang dapat ditampilkan.</p>}
          {buktiAda === true && (
            <img src={`/api/admin/receipts/${donasi.receiptKey}`} alt={`Bukti transfer donasi ${donasi.referensi} (privat)`} className="mt-3 max-h-64 w-full rounded-lg border border-border object-contain" />
          )}
        </div>

        {opsi.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/60 p-4">
            <h4 className="text-sm font-semibold">Ubah status (keputusan manual)</h4>
            {galat && <p className="mt-2 rounded-lg border border-cta-100 bg-cta-50 p-2 text-xs text-cta-700" role="alert">{galat}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="dd-status" className="mb-1 block text-xs font-semibold">Status tujuan</label>
                <select id="dd-status" value={statusBaru} onChange={(e) => setStatusBaru(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm">
                  <option value="">— pilih —</option>
                  {opsi.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="dd-alasan" className="mb-1 block text-xs font-semibold">Alasan (wajib, tercatat di audit)</label>
                <input id="dd-alasan" value={alasan} onChange={(e) => setAlasan(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={300} />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Versi data: {donasi.version}. Bila petugas lain mengubah lebih dulu, keputusan Anda ditolak server (cek versi).</p>
            <button type="button" onClick={keputusan} disabled={memuat} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> {memuat ? "Menyimpan…" : "Simpan keputusan"}
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Status ini sudah final pada mesin status; tidak ada transisi lanjutan yang diizinkan.
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= ANTREAN SEWA ================= */
function AntreanSewa() {
  const [items, setItems] = useState<Sewa[] | null>(null);
  const [filter, setFilter] = useState("");
  const [versi, setVersi] = useState(0);
  const [buka, setBuka] = useState<Sewa | null>(null);

  useEffect(() => {
    let aktif = true;
    fetch(`/api/admin/rentals${filter ? `?status=${filter}` : ""}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (aktif) setItems(d.items ?? []);
      })
      .catch(() => {
        if (aktif) setItems([]);
      });
    return () => {
      aktif = false;
    };
  }, [filter, versi]);

  const muatData = () => setVersi((v) => v + 1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl">Antrean permohonan persewaan</h2>
          <p className="text-sm text-muted-foreground">
            Permohonan = bukan booking; jadwal tidak terkunci, tidak ada pembayaran.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-sewa" className="text-sm font-semibold">Status</label>
          <select id="filter-sewa" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-input px-3 py-2.5 text-sm">
            <option value="">Semua</option>
            <option value="diajukan">Diajukan</option>
            <option value="ditinjau">Ditinjau</option>
            <option value="disetujui">Disetujui</option>
            <option value="perlu-perbaikan">Perlu perbaikan</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <button type="button" onClick={muatData} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted">
            <RefreshCcw className="h-4 w-4" aria-hidden /> Muat ulang
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[32rem] overflow-y-auto scroll-area-thin rounded-xl border border-brand-100">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-brand-50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">Referensi</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Penyewa</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Item</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items === null && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Memuat…</td></tr>}
            {items !== null && items.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Tidak ada data.</td></tr>}
            {items?.map((s) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="px-3 py-2.5 font-mono text-xs">{s.referensi}</td>
                <td className="px-3 py-2.5">{s.penyewa}</td>
                <td className="px-3 py-2.5">{s.itemNama}</td>
                <td className="px-3 py-2.5"><StatusBadge status={s.status} /></td>
                <td className="px-3 py-2.5">
                  <button type="button" onClick={() => setBuka(s)} className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">Buka</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {buka && <DetailSewa sewa={buka} tutup={() => setBuka(null)} padaBerubah={muatData} />}
    </div>
  );
}

function DetailSewa({ sewa, tutup, padaBerubah }: { sewa: Sewa; tutup: () => void; padaBerubah: () => void }) {
  const jadwal = JSON.parse(sewa.jadwal || "{}") as { mulai?: string; selesai?: string };
  const rincian = JSON.parse(sewa.rincianJenis || "{}") as Record<string, unknown>;
  const estimasi = JSON.parse(sewa.estimasiSnapshot || "{}") as { rincian?: { label: string; jumlah: number }[]; total?: number };
  const [statusBaru, setStatusBaru] = useState("");
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(false);
  const opsi = OPSI_STATUS_SEWA[sewa.status] ?? [];

  const keputusan = async () => {
    setGalat("");
    if (!statusBaru) { setGalat("Pilih status tujuan"); return; }
    if (alasan.trim().length < 5) { setGalat("Alasan keputusan wajib diisi (minimal 5 karakter)"); return; }
    setMemuat(true);
    try {
      const res = await fetch(`/api/admin/rentals/${sewa.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBaru, alasan: alasan.trim(), version: sewa.version }),
      });
      const d = await res.json();
      if (!res.ok) {
        setGalat(d.errors?.version ?? d.errors?.alasan ?? d.error ?? "Gagal mengubah status");
        return;
      }
      tutup();
      padaBerubah();
    } finally {
      setMemuat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Detail persewaan ${sewa.referensi}`}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto scroll-area-thin rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-mono text-lg font-bold">{sewa.referensi}</h3>
            <StatusBadge status={sewa.status} />
          </div>
          <button type="button" onClick={tutup} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted" aria-label="Tutup detail">Tutup</button>
        </div>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Penyewa</dt><dd className="font-semibold">{sewa.penyewa}</dd></div>
          <div><dt className="text-muted-foreground">Kontak</dt><dd>{sewa.kontak}</dd></div>
          <div><dt className="text-muted-foreground">Alamat</dt><dd>{sewa.alamat}</dd></div>
          <div><dt className="text-muted-foreground">Item</dt><dd>{sewa.itemNama}</dd></div>
          <div><dt className="text-muted-foreground">Jadwal (permohonan)</dt><dd>{formatTanggal(jadwal.mulai)} s.d. {formatTanggal(jadwal.selesai)}</dd></div>
        </dl>
        <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
          <p className="font-semibold">Rincian sesuai jenis</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(rincian).map(([k, v]) => (
              <li key={k}>{k}: <strong>{String(v)}</strong></li>
            ))}
          </ul>
        </div>
        {estimasi.rincian && (
          <div className="mt-3 rounded-lg border border-brand-100 p-3 text-sm">
            <p className="font-semibold">Estimasi (snapshot server)</p>
            <ul className="mt-1">
              {estimasi.rincian.map((r) => (
                <li key={r.label} className="flex justify-between"><span>{r.label}</span><span className="tabular-nums">{formatRupiah(r.jumlah)}</span></li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-border pt-2 font-bold"><span>Total</span><span className="tabular-nums">{formatRupiah(estimasi.total ?? 0)}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">Estimasi belum final; bukan tagihan pembayaran.</p>
          </div>
        )}
        {sewa.keputusanAlasan && (
          <p className="mt-3 text-sm"><span className="text-muted-foreground">Keputusan terakhir:</span> {sewa.keputusanAlasan}</p>
        )}

        {opsi.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/60 p-4">
            <h4 className="text-sm font-semibold">Ubah status (keputusan manual)</h4>
            {galat && <p className="mt-2 rounded-lg border border-cta-100 bg-cta-50 p-2 text-xs text-cta-700" role="alert">{galat}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ds-status" className="mb-1 block text-xs font-semibold">Status tujuan</label>
                <select id="ds-status" value={statusBaru} onChange={(e) => setStatusBaru(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm">
                  <option value="">— pilih —</option>
                  {opsi.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ds-alasan" className="mb-1 block text-xs font-semibold">Alasan (wajib, tercatat di audit)</label>
                <input id="ds-alasan" value={alasan} onChange={(e) => setAlasan(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={300} />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Versi data: {sewa.version}. Pemeriksaan versi mencegah dua petugas saling menimpa.</p>
            <button type="button" onClick={keputusan} disabled={memuat} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> {memuat ? "Menyimpan…" : "Simpan keputusan"}
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Status ini sudah final pada mesin status; tidak ada transisi lanjutan yang diizinkan.
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= NOTIFIKASI ================= */
function PanelNotifikasi() {
  const [items, setItems] = useState<Notifikasi[] | null>(null);
  const [jenis, setJenis] = useState("");
  const [status, setStatus] = useState("");
  const [hanyaBelum, setHanyaBelum] = useState(false);
  const [versi, setVersi] = useState(0);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    let aktif = true;
    const p = new URLSearchParams();
    if (jenis) p.set("jenis", jenis);
    if (status) p.set("status", status);
    if (hanyaBelum) p.set("unread", "1");
    fetch(`/api/admin/notifications?${p.toString()}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (aktif) setItems(d.items ?? []);
      })
      .catch(() => {
        if (aktif) setItems([]);
      });
    return () => {
      aktif = false;
    };
  }, [jenis, status, hanyaBelum, versi]);

  const muatData = () => setVersi((v) => v + 1);

  const tandaiDibaca = async (id: string) => {
    await fetch(`/api/admin/notifications/${id}/read`, { method: "POST" });
    muatData();
  };

  const kirimUlang = async (id: string, deliveryId: string) => {
    setPesan("");
    const res = await fetch(`/api/admin/notifications/${id}/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryId }),
    });
    const d = await res.json();
    setPesan(d.pesan ?? (d.ok ? "Terkirim" : "Gagal"));
    muatData();
  };

  return (
    <div>
      <h2 className="text-xl">Notifikasi pengajuan</h2>
      <p className="text-sm text-muted-foreground">
        Daftar hanya menampilkan ringkasan pengajuan — tanpa bukti transfer maupun data pribadi yang berlebihan.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="nf-jenis" className="mb-1 block text-xs font-semibold">Jenis</label>
          <select id="nf-jenis" value={jenis} onChange={(e) => setJenis(e.target.value)} className="rounded-lg border border-input px-3 py-2 text-sm">
            <option value="">Semua</option>
            <option value="donasi">Donasi</option>
            <option value="persewaan">Persewaan</option>
          </select>
        </div>
        <div>
          <label htmlFor="nf-status" className="mb-1 block text-xs font-semibold">Status entitas</label>
          <select id="nf-status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-input px-3 py-2 text-sm">
            <option value="">Semua</option>
            <option value="menunggu-verifikasi">Menunggu verifikasi</option>
            <option value="diajukan">Diajukan</option>
            <option value="ditinjau">Ditinjau</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="nf-belum" type="checkbox" checked={hanyaBelum} onChange={(e) => setHanyaBelum(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="nf-belum" className="text-sm font-semibold">Belum dibaca saja</label>
        </div>
      </div>
      {pesan && <p className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}

      <ul className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto scroll-area-thin">
        {items === null && <li className="rounded-xl border border-brand-100 bg-white p-4 text-sm text-muted-foreground">Memuat…</li>}
        {items !== null && items.length === 0 && (
          <li className="rounded-xl border border-brand-100 bg-white p-4 text-sm text-muted-foreground">Tidak ada notifikasi pada filter ini.</li>
        )}
        {items?.map((n) => (
          <li key={n.id} className={`rounded-xl border p-4 ${n.dibaca ? "border-border bg-white" : "border-brand-300 bg-brand-50/70"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {!n.dibaca && <StatusBadge status="belumDibaca" />}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold capitalize">{n.jenis}</span>
                <span className="font-mono text-sm font-bold">{n.referensi}</span>
                {n.statusEntitas && <StatusBadge status={n.statusEntitas} />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatTanggal(n.createdAt)}</span>
                {!n.dibaca && (
                  <button type="button" onClick={() => tandaiDibaca(n.id)} className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                    Tandai dibaca
                  </button>
                )}
              </div>
            </div>
            <ul className="mt-2 space-y-1">
              {n.deliveries.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs">
                  <span>
                    Kanal <strong className="capitalize">{d.kanal}</strong> · <StatusBadge status={d.status} /> · percobaan {d.percobaan}
                  </span>
                  {d.status === "gagal" && (
                    <button type="button" onClick={() => kirimUlang(n.id, d.id)} className="inline-flex items-center gap-1 rounded-lg border border-brand-300 px-2.5 py-1.5 font-semibold text-brand-700 hover:bg-brand-50">
                      <Send className="h-3 w-3" aria-hidden /> Kirim ulang
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= BERITA (editor) ================= */
function PanelBerita() {
  const [items, setItems] = useState<Artikel[]>([]);
  const [form, setForm] = useState({ judul: "", kategori: "Kegiatan", ringkasan: "", isi: "", mediaAlt: "", mediaUrl: "", publicationConsent: false });
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");

  const muatData = useCallback(() => {
    fetch("/api/admin/articles")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat("");
    setPesan("");
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (!res.ok) {
      setGalat(Object.values(d.errors ?? {})[0] as string ?? d.error ?? "Gagal menyimpan");
      return;
    }
    setPesan("Berita draf tersimpan. Ajukan persetujuan dari daftar.");
    setForm({ judul: "", kategori: "Kegiatan", ringkasan: "", isi: "", mediaAlt: "", mediaUrl: "", publicationConsent: false });
    muatData();
  };

  const ubahStatus = async (id: string, status: string) => {
    setPesan("");
    setGalat("");
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const d = await res.json();
      setGalat(d.error ?? "Gagal ubah status");
      return;
    }
    muatData();
  };

  const lanjutan: Record<string, string[]> = {
    draf: ["menunggu-persetujuan"],
    "menunggu-persetujuan": ["terbit", "draf"],
    terbit: ["ditarik"],
    ditarik: ["draf"],
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h2 className="text-xl">Berita</h2>
        {galat && <p className="mt-2 rounded-lg border border-cta-100 bg-cta-50 p-2 text-sm text-cta-700" role="alert">{galat}</p>}
        {pesan && <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}
        <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto scroll-area-thin">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{a.judul}</p>
                  <p className="text-xs text-muted-foreground">{a.kategori} · /{a.slug}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(lanjutan[a.status] ?? []).map((s) => (
                  <button key={s} type="button" onClick={() => ubahStatus(a.id, s)} className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    {s === "menunggu-persetujuan" ? "Ajukan persetujuan" : s === "terbit" ? "Terbitkan" : s === "ditarik" ? "Tarik" : "Jadikan draf"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <form className="lg:col-span-2 h-fit rounded-2xl border border-brand-100 bg-white p-5" onSubmit={simpan}>
        <h3 className="text-lg">Tulis berita baru</h3>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="b-judul" className="mb-1 block text-sm font-semibold">Judul</label>
            <input id="b-judul" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={200} />
          </div>
          <div>
            <label htmlFor="b-kat" className="mb-1 block text-sm font-semibold">Kategori</label>
            <input id="b-kat" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={60} />
          </div>
          <div>
            <label htmlFor="b-ring" className="mb-1 block text-sm font-semibold">Ringkasan</label>
            <textarea id="b-ring" value={form.ringkasan} onChange={(e) => setForm({ ...form, ringkasan: e.target.value })} required rows={2} maxLength={400} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label htmlFor="b-isi" className="mb-1 block text-sm font-semibold">Isi (markdown; HTML mentah tidak dirender)</label>
            <textarea id="b-isi" value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} required rows={5} maxLength={20000} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label htmlFor="b-alt" className="mb-1 block text-sm font-semibold">Teks alt foto (wajib bila ada foto)</label>
            <input id="b-alt" value={form.mediaAlt} onChange={(e) => setForm({ ...form, mediaAlt: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={200} />
          </div>
          <div>
            <label htmlFor="b-url" className="mb-1 block text-sm font-semibold">URL foto (opsional, https)</label>
            <input id="b-url" value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" placeholder="https://…" />
          </div>
          <div className="flex items-start gap-2">
            <input id="b-consent" type="checkbox" checked={form.publicationConsent} onChange={(e) => setForm({ ...form, publicationConsent: e.target.checked })} className="mt-1 h-4 w-4" />
            <label htmlFor="b-consent" className="text-sm">Foto memiliki izin tayang (publicationConsent)</label>
          </div>
          <button type="submit" className="min-h-[44px] w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Simpan sebagai draf</button>
        </div>
      </form>
    </div>
  );
}

/* ================= PENGUMUMAN (editor) ================= */
function PanelPengumuman() {
  const [items, setItems] = useState<Pengumuman[]>([]);
  const [form, setForm] = useState({ judul: "", isi: "", kategori: "Umum", prioritas: "biasa" });
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");

  const muatData = useCallback(() => {
    fetch("/api/admin/announcements")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(""); setGalat("");
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setGalat(d.error ?? "Gagal menyimpan"); return; }
    setPesan("Pengumuman draf tersimpan.");
    setForm({ judul: "", isi: "", kategori: "Umum", prioritas: "biasa" });
    muatData();
  };

  const ubahStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    muatData();
  };

  const lanjutan: Record<string, string[]> = {
    draf: ["menunggu-persetujuan"],
    "menunggu-persetujuan": ["terbit", "draf"],
    terbit: ["ditarik"],
    ditarik: ["draf"],
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h2 className="text-xl">Pengumuman</h2>
        {galat && <p className="mt-2 rounded-lg border border-cta-100 bg-cta-50 p-2 text-sm text-cta-700" role="alert">{galat}</p>}
        {pesan && <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}
        <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto scroll-area-thin">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.judul}</p>
                  <p className="text-xs text-muted-foreground">{p.kategori} · {p.prioritas}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(lanjutan[p.status] ?? []).map((s) => (
                  <button key={s} type="button" onClick={() => ubahStatus(p.id, s)} className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    {s === "menunggu-persetujuan" ? "Ajukan persetujuan" : s === "terbit" ? "Terbitkan" : s === "ditarik" ? "Tarik" : "Jadikan draf"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <form className="lg:col-span-2 h-fit rounded-2xl border border-brand-100 bg-white p-5" onSubmit={simpan}>
        <h3 className="text-lg">Tulis pengumuman</h3>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="p-judul" className="mb-1 block text-sm font-semibold">Judul</label>
            <input id="p-judul" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={200} />
          </div>
          <div>
            <label htmlFor="p-isi" className="mb-1 block text-sm font-semibold">Isi</label>
            <textarea id="p-isi" value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} required rows={4} maxLength={2000} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-kat" className="mb-1 block text-sm font-semibold">Kategori</label>
              <input id="p-kat" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={60} />
            </div>
            <div>
              <label htmlFor="p-pri" className="mb-1 block text-sm font-semibold">Prioritas</label>
              <select id="p-pri" value={form.prioritas} onChange={(e) => setForm({ ...form, prioritas: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm">
                <option value="biasa">Biasa</option>
                <option value="penting">Penting</option>
              </select>
            </div>
          </div>
          <button type="submit" className="min-h-[44px] w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Simpan sebagai draf</button>
        </div>
      </form>
    </div>
  );
}

/* ================= STATISTIK (editor) ================= */
interface Baris { label: string; jumlah?: number; persen?: number }
function PanelStatistik() {
  const [periode, setPeriode] = useState("Tahun Ajaran 2025/2026");
  const [sumber, setSumber] = useState("Data internal lembaga");
  const [usia, setUsia] = useState<Baris[]>([
    { label: "0–6 tahun", jumlah: 10 },
    { label: "7–12 tahun", jumlah: 34 },
    { label: "13–15 tahun", jumlah: 56 },
    { label: "16–18 tahun", jumlah: 45 },
    { label: "19 tahun ke atas", jumlah: 5 },
  ]);
  const [pendidikan, setPendidikan] = useState<Baris[]>([
    { label: "PAUD–SD/MI", jumlah: 34 },
    { label: "SMP/MTs", jumlah: 56 },
    { label: "SMA/SMK/MA", jumlah: 45 },
    { label: "Perguruan tinggi", jumlah: 15 },
  ]);
  const [alokasi, setAlokasi] = useState<Baris[]>([
    { label: "Pendidikan", persen: 45 },
    { label: "Makanan gizi", persen: 30 },
    { label: "Kesehatan", persen: 15 },
    { label: "Operasional", persen: 10 },
  ]);
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");

  const total = (arr: Baris[], k: "jumlah" | "persen") => arr.reduce((a, b) => a + (b[k] ?? 0), 0);

  const simpan = async () => {
    setPesan(""); setGalat("");
    const res = await fetch("/api/admin/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periode, sumber, usiaAgregat: usia, pendidikanAgregat: pendidikan, alokasi }),
    });
    const d = await res.json();
    if (!res.ok) {
      setGalat(Object.values(d.errors ?? {})[0] as string ?? d.error ?? "Gagal menyimpan");
      return;
    }
    setPesan("Versi statistik baru tersimpan; halaman publik menampilkan versi terbaru dengan periode & sumber.");
  };

  const tabelKelompok = (judul: string, arr: Baris[], k: "jumlah" | "persen", setArr: (v: Baris[]) => void) => (
    <div className="rounded-xl border border-brand-100 bg-white p-4">
      <h3 className="font-semibold">{judul} <span className="text-xs font-normal text-muted-foreground">({k === "persen" ? `total ${total(arr, k)}%` : `total ${total(arr, k)}`})</span></h3>
      <ul className="mt-2 space-y-2">
        {arr.map((b, i) => (
          <li key={i} className="flex gap-2">
            <input aria-label={`${judul} baris ${i + 1} label`} value={b.label} onChange={(e) => setArr(arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="flex-1 rounded-lg border border-input px-2.5 py-2 text-sm" />
            <input aria-label={`${judul} baris ${i + 1} angka`} inputMode="numeric" value={b[k] ?? ""} onChange={(e) => setArr(arr.map((x, j) => (j === i ? { ...x, [k]: Number.parseInt(e.target.value, 10) || 0 } : x)))} className="w-20 rounded-lg border border-input px-2.5 py-2 text-sm tabular-nums" />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl">Statistik agregat (versi baru)</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Menyimpan versi baru (riwayat terjaga). Alokasi harus berjumlah tepat 100% agar angka grafik = tabel.
      </p>
      {galat && <p className="mt-2 rounded-lg border border-cta-100 bg-cta-50 p-2 text-sm text-cta-700" role="alert">{galat}</p>}
      {pesan && <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="st-periode" className="mb-1 block text-sm font-semibold">Periode</label>
          <input id="st-periode" value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={120} />
        </div>
        <div>
          <label htmlFor="st-sumber" className="mb-1 block text-sm font-semibold">Sumber</label>
          <input id="st-sumber" value={sumber} onChange={(e) => setSumber(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={200} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {tabelKelompok("Usia", usia, "jumlah", setUsia)}
        {tabelKelompok("Pendidikan", pendidikan, "jumlah", setPendidikan)}
        {tabelKelompok("Alokasi (%)", alokasi, "persen", setAlokasi)}
      </div>
      <button type="button" onClick={simpan} className="mt-4 min-h-[44px] rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        Simpan versi statistik
      </button>
    </div>
  );
}

/* ================= PENGASUH (editor) ================= */
function PanelPengasuh() {
  const [items, setItems] = useState<Pengasuh[]>([]);
  const [nama, setNama] = useState("");
  const [peran, setPeran] = useState("");
  const [pesan, setPesan] = useState("");

  const muatData = useCallback(() => {
    fetch("/api/admin/staff")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const ubah = async (id: string, publicationConsent?: boolean, status?: string) => {
    await fetch("/api/admin/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, publicationConsent, status }),
    });
    muatData();
  };

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, peran }),
    });
    if (res.ok) { setNama(""); setPeran(""); setPesan("Pengasuh draf ditambahkan."); muatData(); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h2 className="text-xl">Direktori pengasuh</h2>
        <p className="text-sm text-muted-foreground">Tampil publik hanya bila status terbit DAN izin tayang dicentang.</p>
        {pesan && <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}
        <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto scroll-area-thin">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white p-4">
              <div>
                <p className="font-semibold">{s.nama}</p>
                <p className="text-xs text-muted-foreground">{s.peran}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold">
                  <input type="checkbox" checked={s.publicationConsent} onChange={(e) => ubah(s.id, e.target.checked)} className="h-4 w-4" />
                  Izin tayang
                </label>
                <StatusBadge status={s.status} />
                <button type="button" onClick={() => ubah(s.id, undefined, s.status === "terbit" ? "draf" : "terbit")} className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                  {s.status === "terbit" ? "Jadikan draf" : "Terbitkan"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <form className="lg:col-span-2 h-fit rounded-2xl border border-brand-100 bg-white p-5" onSubmit={tambah}>
        <h3 className="text-lg">Tambah pengasuh</h3>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="s-nama" className="mb-1 block text-sm font-semibold">Nama</label>
            <input id="s-nama" value={nama} onChange={(e) => setNama(e.target.value)} required className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={120} />
          </div>
          <div>
            <label htmlFor="s-peran" className="mb-1 block text-sm font-semibold">Peran</label>
            <input id="s-peran" value={peran} onChange={(e) => setPeran(e.target.value)} required className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" maxLength={80} />
          </div>
          <button type="submit" className="min-h-[44px] w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Tambah</button>
        </div>
      </form>
    </div>
  );
}

/* ================= KATALOG (editor) ================= */
function PanelKatalog() {
  const [items, setItems] = useState<KatalogItem[]>([]);
  const [pesan, setPesan] = useState("");

  const muatData = useCallback(() => {
    fetch("/api/admin/rental-items")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const simpanTarif = async (id: string, tarifContoh: number) => {
    const res = await fetch("/api/admin/rental-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tarifContoh }),
    });
    setPesan(res.ok ? "Tarif diperbarui." : "Gagal memperbarui tarif.");
    muatData();
  };
  const ubahStatus = async (id: string, status: string, tarifContoh: number) => {
    await fetch("/api/admin/rental-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tarifContoh, status }),
    });
    muatData();
  };

  return (
    <div>
      <h2 className="text-xl">Katalog &amp; tarif</h2>
      {pesan && <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}
      <ul className="mt-3 grid gap-3 md:grid-cols-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{it.nama}</p>
              <StatusBadge status={it.status} />
            </div>
            <p className="text-xs text-muted-foreground">{it.jenis} · {it.satuan}</p>
            <label htmlFor={`tarif-${it.id}`} className="mt-2 block text-xs font-semibold">Tarif contoh (rupiah)</label>
            <div className="mt-1 flex gap-2">
              <input id={`tarif-${it.id}`} inputMode="numeric" defaultValue={it.tarifContoh} onBlur={(e) => { const v = Number.parseInt(e.target.value, 10); if (Number.isInteger(v) && v !== it.tarifContoh) simpanTarif(it.id, v); }} className="w-32 rounded-lg border border-input px-2.5 py-2 text-sm tabular-nums" />
              <button type="button" onClick={() => ubahStatus(it.id, it.status === "terbit" ? "draf" : "terbit", it.tarifContoh)} className="rounded-lg border border-brand-300 px-2.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                {it.status === "terbit" ? "Jadikan draf" : "Terbitkan"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= AKUN (pengelola) ================= */
function PanelAkun() {
  const [items, setItems] = useState<Akun[]>([]);
  const [pesan, setPesan] = useState("");

  const muatData = useCallback(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const ubahPeran = async (id: string, role: string) => {
    setPesan("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    const d = await res.json();
    setPesan(res.ok ? "Peran diperbarui." : (d.error ?? "Gagal mengubah peran"));
    muatData();
  };

  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl">
        <UserCog className="h-5 w-5 text-brand-600" aria-hidden />
        Akun &amp; peran (hanya pengelola)
      </h2>
      <p className="text-sm text-muted-foreground">
        Perubahan peran dan kata sandi hanya dapat dilakukan dari panel ini; hak akses selalu diperiksa ulang di server.
      </p>
      {pesan && <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}
      <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto scroll-area-thin">
        {items.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white p-4">
            <div>
              <p className="font-semibold">{u.nama}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Peran</span>
              <select value={u.role} onChange={(e) => ubahPeran(u.id, e.target.value)} className="rounded-lg border border-input px-3 py-2 text-sm" aria-label={`Peran untuk ${u.nama}`}>
                <option value="editor">editor</option>
                <option value="verifikator">verifikator</option>
                <option value="pengelola">pengelola</option>
              </select>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <XCircle className="h-3.5 w-3.5 text-cta-500" aria-hidden />
        Editor tidak dapat membuka halaman ini; percobaan ditolak 403 di server.
      </p>
    </div>
  );
}
