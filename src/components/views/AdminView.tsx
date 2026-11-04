"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell, FileText, FolderOpen, Lock, LogOut, RefreshCcw, Send,
  Table2, Users, Wrench, Download, XCircle, CheckCircle2, ImageIcon,
} from "lucide-react";
import { LogoMark } from "@/components/site/LogoMark";
import { formatRupiah, formatTanggal } from "@/lib/pricing";
import { apiFetch, apiImageUrl } from "@/lib/api";

/**
 * Dashboard LKSA Danukusumo. Satu akun admin mengelola seluruh konten, donasi, persewaan, dan pengumuman.
 */
interface Sesi { nama: string; role: "admin"; email: string }
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
  publishedAt: string | null; mediaAlt: string | null;
  ringkasan?: string; isi?: string; mediaUrl?: string | null;
}
interface Pengumuman {
  id: string; judul: string; isi: string; kategori: string; prioritas: string; status: string; publishedAt: string | null;
}
interface Pengasuh { id: string; nama: string; peran: string; status: string }
interface KatalogItem { id: string; nama: string; jenis: string; satuan: string; tarifContoh: number; status: string; foto: string }

export function AdminView({ kembali }: { kembali: () => void }) {
  const [sesi, setSesi] = useState<Sesi | null | undefined>(undefined);
  const [tab, setTab] = useState("antrean-donasi");

  useEffect(() => {
    apiFetch("/api/admin/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setSesi(d ? { nama: d.nama, role: d.role, email: d.email } : null);
      })
      .catch(() => setSesi(null));
  }, []);

  // semua tab tersedia untuk admin
  const tabAktif = tab;

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
    { key: "antrean-donasi", label: "Donasi", ikon: Download },
    { key: "usaha-panti", label: "Usaha Panti", ikon: Wrench },
    { key: "notifikasi", label: "Notifikasi", ikon: Bell },
    { key: "informasi-panti", label: "Informasi Panti", ikon: FileText },
    { key: "statistik", label: "Statistik", ikon: Table2 },
    { key: "pengasuh", label: "Pengasuh", ikon: Users },
  ];

  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl">Dashboard</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await apiFetch("/api/admin/logout", { method: "POST" });
              setSesi(null);
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-cta-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cta-600"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Keluar
          </button>
        </div>
      </div>

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
        {tabAktif === "usaha-panti" && <PanelUsahaPanti />}
        {tabAktif === "notifikasi" && <PanelNotifikasi />}
        {tabAktif === "informasi-panti" && <PanelInformasiPanti />}
        {tabAktif === "statistik" && <PanelStatistik />}
        {tabAktif === "pengasuh" && <PanelPengasuh />}
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
      const res = await apiFetch("/api/admin/login", {
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
            Masuk Dashboard
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Masukkan email dan password untuk mengelola situs.
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
  const [versi, setVersi] = useState(0);
  const [buka, setBuka] = useState<Donasi | null>(null);

  useEffect(() => {
    let aktif = true;
    apiFetch("/api/admin/donations")
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
  }, [versi]);

  const muatData = () => setVersi((v) => v + 1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl">Antrean konfirmasi donasi</h2>
          <p className="text-sm text-muted-foreground">
            Kelola konfirmasi donasi yang masuk dari donatur.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={muatData} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted">
            <RefreshCcw className="h-4 w-4" aria-hidden /> Muat ulang
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[32rem] overflow-y-auto scroll-area-thin rounded-xl border border-brand-100">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-brand-50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">Nomor</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Donatur</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Nominal</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items === null && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Memuat…</td></tr>
            )}
            {items !== null && items.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Tidak ada data.</td></tr>
            )}
            {items?.map((d, i) => (
              <tr key={d.id} className="border-t border-border/60">
                <td className="px-3 py-2.5 tabular-nums">{i + 1}</td>
                <td className="px-3 py-2.5">{d.nama}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatRupiah(d.nominalRupiah)}</td>
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

  useEffect(() => {
    apiFetch(`/api/admin/receipts/${donasi.receiptKey}`)
      .then((r) => setBuktiAda(r.ok))
      .catch(() => setBuktiAda(false));
  }, [donasi.receiptKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Detail donasi ${donasi.referensi}`}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto scroll-area-thin rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-mono text-lg font-bold">{donasi.referensi}</h3>
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
            Bukti transfer
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Klik tombol di bawah untuk melihat bukti transfer donatur.
          </p>
          {buktiAda === null && (
            <button
              type="button"
              onClick={() => {
                apiFetch(`/api/admin/receipts/${donasi.receiptKey}`)
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
            <img src={apiImageUrl(`/api/admin/receipts/${donasi.receiptKey}`)} alt={`Bukti transfer donasi ${donasi.referensi} (privat)`} className="mt-3 max-h-64 w-full rounded-lg border border-border object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= ANTREAN SEWA ================= */
function AntreanSewa() {
  const [items, setItems] = useState<Sewa[] | null>(null);
  const [versi, setVersi] = useState(0);
  const [buka, setBuka] = useState<Sewa | null>(null);

  useEffect(() => {
    let aktif = true;
    apiFetch("/api/admin/rentals")
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
  }, [versi]);

  const muatData = () => setVersi((v) => v + 1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl">Antrean Permohonan Sewa</h2>
          <p className="text-sm text-muted-foreground">
            Ini adalah permohonan, bukan booking. Jadwal belum dikunci dan belum ada pembayaran.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={muatData} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted">
            <RefreshCcw className="h-4 w-4" aria-hidden /> Muat ulang
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[32rem] overflow-y-auto scroll-area-thin rounded-xl border border-brand-100">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-brand-50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">Nomor</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Penyewa</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Item</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items === null && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Memuat…</td></tr>}
            {items !== null && items.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Tidak ada data.</td></tr>}
            {items?.map((s, i) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="px-3 py-2.5 tabular-nums">{i + 1}</td>
                <td className="px-3 py-2.5">{s.penyewa}</td>
                <td className="px-3 py-2.5">{s.itemNama}</td>
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

function bacaJson<T>(nilai: unknown, cadangan: T): T {
  if (nilai && typeof nilai === "object") return nilai as T;
  if (typeof nilai !== "string" || !nilai.trim()) return cadangan;
  try {
    return JSON.parse(nilai) as T;
  } catch {
    return cadangan;
  }
}

function DetailSewa({ sewa, tutup, padaBerubah }: { sewa: Sewa; tutup: () => void; padaBerubah: () => void }) {
  const jadwal = bacaJson<{ mulai?: string; selesai?: string }>(sewa.jadwal, {});
  const rincian = bacaJson<Record<string, unknown>>(sewa.rincianJenis, {});
  const estimasi = bacaJson<{ rincian?: { label: string; jumlah: number }[]; total?: number }>(sewa.estimasiSnapshot, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Detail persewaan ${sewa.referensi}`}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto scroll-area-thin rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-mono text-lg font-bold">{sewa.referensi}</h3>
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
      </div>
    </div>
  );
}

/* ================= NOTIFIKASI ================= */
function PanelNotifikasi() {
  const [items, setItems] = useState<Notifikasi[] | null>(null);
  const [jenis, setJenis] = useState("");
  const [hanyaBelum, setHanyaBelum] = useState(false);
  const [versi, setVersi] = useState(0);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    let aktif = true;
    const p = new URLSearchParams();
    if (jenis) p.set("jenis", jenis);
    if (hanyaBelum) p.set("unread", "1");
    apiFetch(`/api/admin/notifications?${p.toString()}`)
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
  }, [jenis, hanyaBelum, versi]);

  const muatData = () => setVersi((v) => v + 1);

  const tandaiDibaca = async (id: string) => {
    await apiFetch(`/api/admin/notifications/${id}/read`, { method: "POST" });
    muatData();
  };

  const kirimUlang = async (id: string, deliveryId: string) => {
    setPesan("");
    const res = await apiFetch(`/api/admin/notifications/${id}/resend`, {
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
        Ringkasan pengajuan donasi dan persewaan yang masuk.
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
                {!n.dibaca && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">Belum dibaca</span>}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold capitalize">{n.jenis}</span>
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
                    Kanal <strong className="capitalize">{d.kanal}</strong> · {d.status} · percobaan {d.percobaan}
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
  const [form, setForm] = useState({ judul: "", kategori: "Kegiatan", ringkasan: "", isi: "", mediaAlt: "", mediaUrl: "" });
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [unggahan, setUnggahan] = useState<{ url: string; namaFile: string } | null>(null);
  const [memuatUnggah, setMemuatUnggah] = useState(false);
  const [memuat, setMemuat] = useState(false);

  const unggahFile = async (file: File) => {
    setMemuatUnggah(true);
    setGalat("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Gagal mengunggah");
      setUnggahan(d);
      setForm((f) => ({ ...f, mediaUrl: d.url }));
      setPesan("Foto berhasil diunggah.");
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setMemuatUnggah(false);
    }
  };

  const muatData = useCallback(() => {
    apiFetch("/api/admin/articles")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemuat(true);
    setGalat("");
    const res = await apiFetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (!res.ok) {
      setGalat(Object.values(d.errors ?? {})[0] as string ?? d.error ?? "Gagal menyimpan");
      return;
    }
    setPesan("Berita draf tersimpan. Terbitkan dari daftar.");
    setForm({ judul: "", kategori: "Kegiatan", ringkasan: "", isi: "", mediaAlt: "", mediaUrl: "" });
    setUnggahan(null);
    muatData();
  };

  const ubahStatus = async (id: string, status: string) => {
    setPesan("");
    setGalat("");
    const res = await apiFetch(`/api/admin/articles/${id}`, {
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
    draf: ["terbit"],
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
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(lanjutan[a.status] ?? []).map((s) => (
                  <button key={s} type="button" onClick={() => ubahStatus(a.id, s)} className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    {s === "terbit" ? "Terbitkan" : s === "ditarik" ? "Tarik" : "Jadikan draf"}
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
          <div>
            <label htmlFor="b-file" className="mb-1 block text-sm font-semibold">Atau unggah foto dari komputer</label>
            <input id="b-file" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) unggahFile(f); }} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" />
            {unggahan && <p className="mt-1 text-xs text-muted-foreground">Terunggah: {unggahan.namaFile}</p>}
            {unggahan && <img src={unggahan.url} alt="Pratinjau" className="mt-2 h-32 w-full rounded-lg object-cover" />}
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
  const [form, setForm] = useState({ judul: "", isi: "", kategori: "Umum", prioritas: "biasa", mediaAlt: "", mediaUrl: "" });
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");
  const [unggahan, setUnggahan] = useState<{ url: string; namaFile: string } | null>(null);
  const [memuatUnggah, setMemuatUnggah] = useState(false);

  const unggahFile = async (file: File) => {
    setMemuatUnggah(true);
    setGalat("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Gagal mengunggah");
      setUnggahan(d);
      setForm((f) => ({ ...f, mediaUrl: d.url }));
      setPesan("Foto berhasil diunggah.");
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setMemuatUnggah(false);
    }
  };

  const muatData = useCallback(() => {
    apiFetch("/api/admin/announcements")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(""); setGalat("");
    const res = await apiFetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setGalat(d.error ?? "Gagal menyimpan"); return; }
    setPesan("Pengumuman draf tersimpan.");
    setForm({ judul: "", isi: "", kategori: "Umum", prioritas: "biasa", mediaAlt: "", mediaUrl: "" });
    setUnggahan(null);
    muatData();
  };

  const ubahStatus = async (id: string, status: string) => {
    await apiFetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    muatData();
  };

  const lanjutan: Record<string, string[]> = {
    draf: ["terbit"],
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
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(lanjutan[p.status] ?? []).map((s) => (
                  <button key={s} type="button" onClick={() => ubahStatus(p.id, s)} className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    {s === "terbit" ? "Terbitkan" : s === "ditarik" ? "Tarik" : "Jadikan draf"}
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
          <div>
            <label htmlFor="p-file" className="mb-1 block text-sm font-semibold">Unggah foto (opsional)</label>
            <input id="p-file" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) unggahFile(f); }} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" />
            {unggahan && <p className="mt-1 text-xs text-muted-foreground">Terunggah: {unggahan.namaFile}</p>}
            {unggahan && <img src={unggahan.url} alt="Pratinjau" className="mt-2 h-32 w-full rounded-lg object-cover" />}
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
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");

  const total = (arr: Baris[]) => arr.reduce((a, b) => a + (b.jumlah ?? 0), 0);

  const simpan = async () => {
    setPesan(""); setGalat("");
    const res = await apiFetch("/api/admin/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periode, sumber, usiaAgregat: usia, pendidikanAgregat: pendidikan }),
    });
    const d = await res.json();
    if (!res.ok) {
      setGalat(Object.values(d.errors ?? {})[0] as string ?? d.error ?? "Gagal menyimpan");
      return;
    }
    setPesan("Versi statistik baru tersimpan; halaman publik menampilkan versi terbaru dengan periode & sumber.");
  };

  const tabelKelompok = (judul: string, arr: Baris[], setArr: (v: Baris[]) => void) => (
    <div className="rounded-xl border border-brand-100 bg-white p-4">
      <h3 className="font-semibold">{judul} <span className="text-xs font-normal text-muted-foreground">(total {total(arr)})</span></h3>
      <ul className="mt-2 space-y-2">
        {arr.map((b, i) => (
          <li key={i} className="flex gap-2">
            <input aria-label={`${judul} baris ${i + 1} label`} value={b.label} onChange={(e) => setArr(arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="flex-1 rounded-lg border border-input px-2.5 py-2 text-sm" />
            <input aria-label={`${judul} baris ${i + 1} angka`} inputMode="numeric" value={b.jumlah ?? ""} onChange={(e) => setArr(arr.map((x, j) => (j === i ? { ...x, jumlah: Number.parseInt(e.target.value, 10) || 0 } : x)))} className="w-20 rounded-lg border border-input px-2.5 py-2 text-sm tabular-nums" />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl">Statistik</h2>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        Ubah angka statistik agregat. Setiap grafik di halaman publik akan menampilkan angka yang sama dengan tabel ini.
      </div>
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
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {tabelKelompok("Usia", usia, setUsia)}
        {tabelKelompok("Pendidikan", pendidikan, setPendidikan)}
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
  const [unggahan, setUnggahan] = useState<{ url: string; namaFile: string } | null>(null);
  const [memuatUnggah, setMemuatUnggah] = useState(false);

  const unggahFile = async (file: File) => {
    setMemuatUnggah(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Gagal mengunggah");
      setUnggahan(d);
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setMemuatUnggah(false);
    }
  };

  const muatData = useCallback(() => {
    apiFetch("/api/admin/staff")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { nama, peran };
    if (unggahan) body.foto = unggahan.url;
    const res = await apiFetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { setNama(""); setPeran(""); setUnggahan(null); setPesan("Pengasuh draf ditambahkan."); muatData(); }
  };

  const ubah = async (id: string, status?: string) => {
    await apiFetch("/api/admin/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    muatData();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h2 className="text-xl">Direktori pengasuh</h2>
        <p className="text-sm text-muted-foreground">Tampil publik hanya bila status terbit.</p>
        {pesan && <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800" role="status">{pesan}</p>}
        <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto scroll-area-thin">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white p-4">
              <div>
                <p className="font-semibold">{s.nama}</p>
                <p className="text-xs text-muted-foreground">{s.peran}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => ubah(s.id, s.status === "terbit" ? "draf" : "terbit")} className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
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
          <div>
            <label htmlFor="s-file" className="mb-1 block text-sm font-semibold">Foto pengasuh (opsional)</label>
            <input id="s-file" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) unggahFile(f); }} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" />
            {unggahan && <p className="mt-1 text-xs text-muted-foreground">Terunggah: {unggahan.namaFile}</p>}
            {unggahan && <img src={unggahan.url} alt="Pratinjau" className="mt-2 h-32 w-full rounded-lg object-cover" />}
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
  const [unggahanId, setUnggahanId] = useState<string | null>(null);
  const [unggahanFile, setUnggahanFile] = useState<{ url: string; namaFile: string } | null>(null);
  const [memuatUnggah, setMemuatUnggah] = useState(false);

  const unggahFile = async (id: string, file: File) => {
    setUnggahanId(id);
    setMemuatUnggah(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Gagal mengunggah");
      setUnggahanFile(d);
      await apiFetch(`/api/admin/rental-items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, foto: d.url }),
      });
      setPesan("Foto katalog berhasil diperbarui.");
      muatData();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setMemuatUnggah(false);
      setUnggahanId(null);
      setUnggahanFile(null);
    }
  };

  const muatData = useCallback(() => {
    apiFetch("/api/admin/rental-items")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { muatData(); }, [muatData]);

  const simpanTarif = async (id: string, tarifContoh: number) => {
    const res = await apiFetch("/api/admin/rental-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tarifContoh }),
    });
    setPesan(res.ok ? "Tarif diperbarui." : "Gagal memperbarui tarif.");
    muatData();
  };
  const ubahStatus = async (id: string, status: string, tarifContoh: number) => {
    await apiFetch("/api/admin/rental-items", {
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
            </div>
            <p className="text-xs text-muted-foreground">{it.jenis} · {it.satuan}</p>
            {it.foto && <img src={it.foto} alt={it.nama} className="mt-2 h-32 w-full rounded-lg object-cover" />}
            <label htmlFor={`kat-file-${it.id}`} className="mt-2 block text-xs font-semibold">Foto katalog</label>
            <input id={`kat-file-${it.id}`} type="file" accept="image/*" disabled={memuatUnggah && unggahanId === it.id} onChange={(e) => { const f = e.target.files?.[0]; if (f) unggahFile(it.id, f); }} className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" />
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

/* ================= USAHA PANTI ================= */
function PanelUsahaPanti() {
  const [sub, setSub] = useState("sewa");
  return (
    <div>
      <h2 className="text-xl">Usaha Panti</h2>
      <p className="text-sm text-muted-foreground">Kelola permohonan persewaan dan katalog tarif.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setSub("sewa")} className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${sub === "sewa" ? "bg-brand-600 text-white" : "text-brand-800 hover:bg-brand-50"}`}>Antrean Sewa</button>
        <button type="button" onClick={() => setSub("katalog")} className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${sub === "katalog" ? "bg-brand-600 text-white" : "text-brand-800 hover:bg-brand-50"}`}>Katalog & Tarif</button>
      </div>
      <div className="mt-4">
        {sub === "sewa" && <AntreanSewa />}
        {sub === "katalog" && <PanelKatalog />}
      </div>
    </div>
  );
}

/* ================= INFORMASI PANTI ================= */
function PanelInformasiPanti() {
  const [sub, setSub] = useState("berita");
  return (
    <div>
      <h2 className="text-xl">Informasi Panti</h2>
      <p className="text-sm text-muted-foreground">Kelola berita dan pengumuman lembaga.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setSub("berita")} className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${sub === "berita" ? "bg-brand-600 text-white" : "text-brand-800 hover:bg-brand-50"}`}>Berita</button>
        <button type="button" onClick={() => setSub("pengumuman")} className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${sub === "pengumuman" ? "bg-brand-600 text-white" : "text-brand-800 hover:bg-brand-50"}`}>Pengumuman</button>
      </div>
      <div className="mt-4">
        {sub === "berita" && <PanelBerita />}
        {sub === "pengumuman" && <PanelPengumuman />}
      </div>
    </div>
  );
}
