"use client";

import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { GraduationCap, HeartPulse, Users } from "lucide-react";
import { apiFetch, apiImageUrl } from "@/lib/api";

/**
 * Pengurus Panti — halaman data agregat lembaga (PRD-013).
 * - Hanya data AGREGAT (INV-3). Tanpa data individu anak.
 * - Setiap grafik: label angka + legenda + TABEL nonwarna; angka grafik = angka tabel.
 * - Data dari InstitutionStats dengan periode & sumber, berlabel CONTOH (OD-01).
 * - Tanpa scroll horizontal di 320px (grafik responsif + tabel menyesuaikan).
 */
interface Kelompok { label: string; jumlah?: number }
interface StatsItem {
  periode?: string;
  sumber?: string;
  usiaAgregat?: { rincian?: Kelompok[] };
  pendidikanAgregat?: { total?: number; rincian?: Kelompok[] };
}
interface StaffItem { id: string; nama: string; peran: string; foto: string | null }

export function DataPantiView() {
  const [stats, setStats] = useState<StatsItem | null>(null);
  const [staff, setStaff] = useState<StaffItem[]>([]);

  useEffect(() => {
    apiFetch("/api/institution-stats")
      .then((r) => r.json())
      .then((d) => setStats(d.item))
      .catch(() => setStats(null));
    apiFetch("/api/staff")
      .then((r) => r.json())
      .then((d) => setStaff(d.items ?? []))
      .catch(() => setStaff([]));
  }, []);

  const usia = stats?.usiaAgregat?.rincian ?? [];
  const pendidikan = stats?.pendidikanAgregat?.rincian ?? [];
  const totalPendidikan = stats?.pendidikanAgregat?.total ?? pendidikan.reduce((a, b) => a + (b.jumlah ?? 0), 0);

  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
        Pengurus Panti
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Statistik Panti</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-body-text">
        Angka yang ditampilkan merupakan data agregat lembaga — tanpa nama, alamat, maupun identitas
        rinci anak. Periode: <strong>{stats?.periode ?? "Tahun Ajaran 2025/2026"}</strong> ·
        Sumber: <strong>{stats?.sumber ?? "Data internal lembaga"}</strong>. Grafik dan tabel menggunakan
        angka yang sama untuk memudahkan pembacaan.
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
          </div>
        </div>
      </section>

      {/* ===== DIREKTORI PENGASUH ===== */}
      <section className="mt-10" aria-labelledby="judul-pengasuh">
        <h2 id="judul-pengasuh" className="flex items-center gap-2 text-2xl">
          <HeartPulse className="h-5 w-5 text-brand-600" aria-hidden />
          Direktori pengasuh
        </h2>
        <div className="mt-3 grid items-center gap-5 rounded-2xl bg-brand-50/70 p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-5">
          <p className="text-sm text-body-text">
            Profil hanya menampilkan pengasuh yang telah memberikan persetujuan tayang.
          </p>
          <figure className="mx-auto w-full max-w-52 text-center">
            <img
              src="/images/illustrations/pengurus.svg"
              alt="Ilustrasi umum tim pengurus panti"
              className="h-36 w-full object-contain"
            />
            <figcaption className="mt-1 text-xs font-medium text-muted-foreground">
              Ilustrasi pengurus, bukan foto personel
            </figcaption>
          </figure>
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.length === 0 && (
            <li className="rounded-xl border border-brand-100 bg-white p-4 text-sm text-muted-foreground">
              Belum ada profil pengasuh yang disetujui untuk tayang.
            </li>
          )}
          {staff.map((s) => (
            <li key={s.id} className="rounded-xl border border-brand-100 bg-white p-4">
              <div className="flex items-center gap-4">
                {s.foto ? (
                  <div className="relative h-24 w-24 shrink-0">
                    <span className="absolute inset-2 rounded-full bg-brand-200/70 blur-xl" aria-hidden />
                    <img
                      src={s.foto}
                      alt={`Foto ${s.nama}`}
                      loading="lazy"
                      className="relative z-10 h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-lg text-brand-800" aria-hidden>
                    {s.nama.charAt(0)}
                  </span>
                )}
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
