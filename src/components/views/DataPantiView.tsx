"use client";

import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ContohBadge } from "@/components/site/ContohBadge";
import { GraduationCap, HeartPulse, PieChart as PieIcon, Users } from "lucide-react";

/**
 * Dashboard Informasi & Data Panti (PRD-013).
 * - Hanya data AGREGAT (INV-3). Tanpa data individu anak.
 * - Setiap grafik: label angka + legenda + TABEL nonwarna; angka grafik = angka tabel.
 * - Data dari InstitutionStats dengan periode & sumber, berlabel CONTOH (OD-01).
 * - Tanpa scroll horizontal di 320px (grafik responsif + tabel menyesuaikan).
 */
interface Kelompok { label: string; jumlah?: number; persen?: number }
interface StatsItem {
  periode?: string;
  sumber?: string;
  usiaAgregat?: { rincian?: Kelompok[] };
  pendidikanAgregat?: { total?: number; rincian?: Kelompok[] };
  alokasi?: { rincian?: Kelompok[] };
}
interface StaffItem { id: string; nama: string; peran: string }

const WARNA = ["#2C7A64", "#4F9B83", "#8FC4B2", "#C9A24B", "#6B7280"];

export function DataPantiView() {
  const [stats, setStats] = useState<StatsItem | null>(null);
  const [staff, setStaff] = useState<StaffItem[]>([]);

  useEffect(() => {
    fetch("/api/institution-stats")
      .then((r) => r.json())
      .then((d) => setStats(d.item))
      .catch(() => setStats(null));
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => setStaff(d.items ?? []))
      .catch(() => setStaff([]));
  }, []);

  const usia = stats?.usiaAgregat?.rincian ?? [];
  const pendidikan = stats?.pendidikanAgregat?.rincian ?? [];
  const totalPendidikan = stats?.pendidikanAgregat?.total ?? pendidikan.reduce((a, b) => a + (b.jumlah ?? 0), 0);
  const alokasi = stats?.alokasi?.rincian ?? [];
  const totalAlokasi = alokasi.reduce((a, b) => a + (b.persen ?? 0), 0);

  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Dashboard Informasi &amp; Data Panti
        </p>
        <ContohBadge />
      </div>
      <h1 className="mt-2 text-3xl sm:text-4xl">Data agregat lembaga</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-body-text">
        Semua angka pada halaman ini adalah data AGREGAT (INV-3) — tidak memuat nama, alamat,
        atau identitas rinci anak. Periode: <strong>{stats?.periode ?? "CONTOH"}</strong> ·
        Sumber: <strong>{stats?.sumber ?? "CONTOH"}</strong>. Angka grafik selalu disandingkan
        dengan tabel yang sama nilainya.
      </p>

      {/* ===== USIA ===== */}
      <section className="mt-10" aria-labelledby="judul-usia">
        <h2 id="judul-usia" className="flex items-center gap-2 text-2xl">
          <Users className="h-5 w-5 text-brand-600" aria-hidden />
          Sebaran usia anak binaan
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usia} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe5e3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} anak`, "Jumlah"]} />
                  <Bar dataKey="jumlah" name="Jumlah anak" fill="#2C7A64" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#1d4d41" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <table className="w-full text-sm">
              <caption className="sr-only">Tabel sebaran usia anak binaan (angka sama dengan grafik)</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-2 font-semibold">Kelompok usia</th>
                  <th scope="col" className="py-2 text-right font-semibold">Jumlah anak</th>
                </tr>
              </thead>
              <tbody>
                {usia.map((k) => (
                  <tr key={k.label} className="border-b border-border/60">
                    <td className="py-2">{k.label}</td>
                    <td className="py-2 text-right tabular-nums">{k.jumlah}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right tabular-nums">{usia.reduce((a, b) => a + (b.jumlah ?? 0), 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== PENDIDIKAN ===== */}
      <section className="mt-10" aria-labelledby="judul-pendidikan">
        <h2 id="judul-pendidikan" className="flex items-center gap-2 text-2xl">
          <GraduationCap className="h-5 w-5 text-brand-600" aria-hidden />
          Jenjang pendidikan
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pendidikan} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe5e3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} anak`, "Jumlah"]} />
                  <Bar dataKey="jumlah" name="Jumlah anak" fill="#4F9B83" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#1d4d41" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <table className="w-full text-sm">
              <caption className="sr-only">Tabel rincian pendidikan (angka sama dengan grafik)</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-2 font-semibold">Jenjang</th>
                  <th scope="col" className="py-2 text-right font-semibold">Jumlah anak</th>
                </tr>
              </thead>
              <tbody>
                {pendidikan.map((k) => (
                  <tr key={k.label} className="border-b border-border/60">
                    <td className="py-2">{k.label}</td>
                    <td className="py-2 text-right tabular-nums">{k.jumlah}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2">Total pendidikan terdata</td>
                  <td className="py-2 text-right tabular-nums">{totalPendidikan}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              Rincian pendidikan: {pendidikan.map((k) => k.jumlah).join(" + ")} = {totalPendidikan}.
              (Sebelumnya tercatat angka 34+56+45+15 = 150 — CONTOH.)
            </p>
          </div>
        </div>
      </section>

      {/* ===== ALOKASI DANA ===== */}
      <section className="mt-10" aria-labelledby="judul-alokasi">
        <h2 id="judul-alokasi" className="flex items-center gap-2 text-2xl">
          <PieIcon className="h-5 w-5 text-brand-600" aria-hidden />
          Alokasi penggunaan dana
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alokasi}
                    dataKey="persen"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    label={({ label, persen }: { label?: string; persen?: number }) => `${label} ${persen}%`}
                  >
                    {alokasi.map((_, i) => (
                      <Cell key={i} fill={WARNA[i % WARNA.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Porsi"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <table className="w-full text-sm">
              <caption className="sr-only">Tabel alokasi dana (angka sama dengan grafik)</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-2 font-semibold">Pos penggunaan</th>
                  <th scope="col" className="py-2 text-right font-semibold">Porsi</th>
                </tr>
              </thead>
              <tbody>
                {alokasi.map((k) => (
                  <tr key={k.label} className="border-b border-border/60">
                    <td className="py-2">{k.label}</td>
                    <td className="py-2 text-right tabular-nums">{k.persen}%</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right tabular-nums">{totalAlokasi}%</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              Alokasi: {alokasi.map((k) => k.persen).join(" + ")} = {totalAlokasi}%. Rincian
              nominal rupiah diterbitkan terpisah oleh pengurus.
            </p>
          </div>
        </div>
      </section>

      {/* ===== DIREKTORI PENGASUH ===== */}
      <section className="mt-10" aria-labelledby="judul-pengasuh">
        <h2 id="judul-pengasuh" className="flex items-center gap-2 text-2xl">
          <HeartPulse className="h-5 w-5 text-brand-600" aria-hidden />
          Direktori pengasuh
        </h2>
        <p className="mt-2 text-sm text-body-text">
          Hanya pengasuh yang menyetujui tayang profilnya (publicationConsent) yang tampil di
          sini (OD-07). Nama berlabel CONTOH karena masih data sintetis.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.length === 0 && (
            <li className="rounded-xl border border-brand-100 bg-white p-4 text-sm text-muted-foreground">
              Belum ada profil pengasuh yang disetujui untuk tayang.
            </li>
          )}
          {staff.map((s) => (
            <li key={s.id} className="rounded-xl border border-brand-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-lg text-brand-800" aria-hidden>
                  {s.nama.charAt(0)}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{s.nama}</h3>
                  <p className="text-sm text-muted-foreground">{s.peran}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
