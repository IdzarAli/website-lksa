"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, GraduationCap, HeartHandshake, Landmark, Users } from "lucide-react";
import { ContohBadge } from "@/components/site/ContohBadge";
import { PhotoPlaceholder } from "@/components/site/PhotoPlaceholder";
import type { NavKey } from "@/config/site";

/**
 * Beranda (PRD-010). Urutan konten sesuai spesifikasi:
 * hero → statistik → profil → sambutan (DRAF, OD-03) → berita → galeri → CTA donasi.
 * Statistik dibaca dari data (InstitutionStats) dengan periode & sumber, CONTOH (OD-01).
 */
interface StatsAgregat {
  ringkasBeranda?: { nilai?: string; sumber?: string; periode?: string };
  ringkasDonasi?: { nilai?: string; sumber?: string; periode?: string };
  rincian?: { label: string; jumlah: number }[];
}
interface StatItem {
  periode?: string;
  sumber?: string;
  usiaAgregat?: StatsAgregat;
  pendidikanAgregat?: { total?: number; rincian?: { label: string; jumlah: number }[] };
  alokasi?: { rincian?: { label: string; persen: number }[] };
}
interface ArtikelRingkas {
  slug: string;
  judul: string;
  ringkasan: string;
  kategori: string;
  publishedAt: string | null;
}

export function BerandaView({
  pindah,
  bukaBerita,
}: {
  pindah: (tujuan: NavKey) => void;
  bukaBerita: (slug: string) => void;
}) {
  const [stats, setStats] = useState<StatItem | null>(null);
  const [berita, setBerita] = useState<ArtikelRingkas[]>([]);

  useEffect(() => {
    fetch("/api/institution-stats")
      .then((r) => r.json())
      .then((d) => setStats(d.item))
      .catch(() => setStats(null));
    fetch("/api/articles?page=1")
      .then((r) => r.json())
      .then((d) => setBerita((d.items ?? []).slice(0, 3)))
      .catch(() => setBerita([]));
  }, []);

  const nilaiBeranda = stats?.usiaAgregat?.ringkasBeranda?.nilai ?? "35+";
  const sumberBeranda = stats?.usiaAgregat?.ringkasBeranda?.sumber ?? "Data internal lama (belum diperbarui)";
  const periodeBeranda = stats?.usiaAgregat?.ringkasBeranda?.periode ?? "CONTOH";

  return (
    <main id="konten">
      {/* ===== HERO ===== */}
      <section className="border-b border-brand-100 bg-brand-50" aria-labelledby="judul-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Lembaga Kesejahteraan Sosial Anak · {`Purworejo (menunggu pengesahan)`}
            </p>
            <h1 id="judul-hero" className="mt-3 text-3xl leading-tight sm:text-4xl md:text-5xl">
              Mendampingi anak binaan belajar, tumbuh, dan mandiri di Purworejo
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-body-text">
              Situs ini menyajikan profil lembaga, kabar kegiatan, dan data agregat panti.
              Donasi dilakukan lewat transfer di luar website lalu dikonfirmasi dan diperiksa
              manual oleh pengurus — tanpa janji waktu verifikasi.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => pindah("donasi")}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-cta-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-600"
              >
                <HeartHandshake className="h-4 w-4" aria-hidden />
                Cara Berdonasi
              </button>
              <button
                type="button"
                onClick={() => pindah("tentang")}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand-600 px-5 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                Tentang Kami
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <PhotoPlaceholder tinggi="aspect-[4/3]" label="FOTO KEGIATAN ASLI (menunggu dari pengurus)" />
        </div>
      </section>

      {/* ===== STATISTIK (dari data, berperiode & bersumber, CONTOH) ===== */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="judul-statistik">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="judul-statistik" className="text-2xl">Sekilas data lembaga</h2>
          <ContohBadge />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Angka berikut adalah CONTOH dari data agregat (INV-3: tanpa identitas individu anak)
          dengan periode &amp; sumber yang tercantum. Angka antarhalaman sengaja tidak
          diseragamkan (OD-01) karena sumbernya berbeda.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-brand-100 bg-white p-5">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4 text-brand-600" aria-hidden /> Anak binaan aktif
            </dt>
            <dd className="mt-2 font-display text-3xl text-brand-800">{nilaiBeranda}</dd>
            <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Periode: {periodeBeranda} · Sumber: {sumberBeranda}
            </dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-5">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-brand-600" aria-hidden /> Pendidikan terdata
            </dt>
            <dd className="mt-2 font-display text-3xl text-brand-800">
              {stats?.pendidikanAgregat?.total ?? "150"}
            </dd>
            <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Periode: {stats?.periode ?? "CONTOH"} · Sumber: {stats?.sumber ?? "CONTOH"}
            </dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-5">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpenCheck className="h-4 w-4 text-brand-600" aria-hidden /> Alokasi pendidikan
            </dt>
            <dd className="mt-2 font-display text-3xl text-brand-800">
              {stats?.alokasi?.rincian?.find((a) => a.label.toLowerCase().includes("pendidikan"))?.persen ?? 45}%
            </dd>
            <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Periode: {stats?.periode ?? "CONTOH"} · Sumber: {stats?.sumber ?? "CONTOH"}
            </dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-5">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Landmark className="h-4 w-4 text-brand-600" aria-hidden /> Pengasuh berizin tayang
            </dt>
            <dd className="mt-2 font-display text-3xl text-brand-800">3</dd>
            <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Hanya profil yang disetujui pemiliknya yang tampil (OD-07)
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => pindah("data")}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          Lihat Dashboard Informasi &amp; Data Panti
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </section>

      {/* ===== PROFIL ===== */}
      <section className="border-y border-brand-100 bg-brand-50/50" aria-labelledby="judul-profil">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 id="judul-profil" className="text-2xl">Profil singkat</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-brand-100 bg-white p-5">
              <h3 className="text-lg">Lokasi &amp; status lembaga</h3>
              <p className="mt-2 text-sm leading-relaxed text-body-text">
                Berada di {`Purworejo, Jawa Tengah`}. Narasi sejarah dan legalitas lembaga masih{" "}
                <strong>menunggu pengesahan pengurus</strong> (OD-08) sehingga tidak diterbitkan
                sebagai final di halaman ini.
              </p>
            </div>
            <div className="rounded-xl border border-brand-100 bg-white p-5">
              <h3 className="text-lg">Pendampingan harian</h3>
              <p className="mt-2 text-sm leading-relaxed text-body-text">
                Anak binaan didampingi pengasuh tinggal dan pendamping belajar dalam jadwal
                harian terstruktur: sekolah, belajar sore, keterampilan, dan ibadah.
              </p>
            </div>
            <div className="rounded-xl border border-brand-100 bg-white p-5">
              <h3 className="text-lg">Keterbukaan data</h3>
              <p className="mt-2 text-sm leading-relaxed text-body-text">
                Data anak hanya ditampilkan sebagai agregat tanpa nama, alamat, atau identitas
                rinci (INV-3). Bukti donasi bersifat privat dan hanya dibuka petugas berwenang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SAMBUTAN (DRAF, OD-03) ===== */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="judul-sambutan">
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="judul-sambutan" className="text-2xl">Sambutan Kepala Pengasuhan</h2>
            <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-900">
              Draf sambutan — belum final
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-body-text">
            {/* OD-03: teks sambutan masih draf dari pengurus, tidak tayang sebagai final */}
            &ldquo;Assalamualaikum. Kami mengucapkan terima kasih kepada para donatur dan relawan
            yang telah mendampingi anak-anak binaan kami. Naskah sambutan lengkap masih disusun
            dan diperiksa oleh pengurus sebelum dinyatakan final. Silakan hubungi sekretariat
            untuk pertanyaan seputar lembaga.&rdquo;
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Teks di atas adalah DRAF SAMBUTAN (OD-03) — menunggu pemeriksaan dan persetujuan pengurus.
          </p>
        </div>
      </section>

      {/* ===== BERITA ===== */}
      <section className="border-y border-brand-100 bg-brand-50/50" aria-labelledby="judul-berita">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="judul-berita" className="text-2xl">Kabar kegiatan terbaru</h2>
            <ContohBadge />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {berita.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada berita terbit.</p>
            )}
            {berita.map((b) => (
              <article key={b.slug} className="flex flex-col rounded-xl border border-brand-100 bg-white p-4">
                <PhotoPlaceholder tinggi="aspect-[16/10]" label="FOTO KEGIATAN ASLI (menunggu dari pengurus)" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {b.kategori}
                  {b.publishedAt ? ` · ${new Date(b.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                </p>
                <h3 className="mt-1 text-base leading-snug">
                  <button
                    type="button"
                    onClick={() => bukaBerita(b.slug)}
                    className="rounded text-left underline-offset-4 hover:underline"
                  >
                    {b.judul}
                  </button>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-body-text">{b.ringkasan}</p>
              </article>
            ))}
          </div>
          <button
            type="button"
            onClick={() => pindah("informasi")}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Semua informasi &amp; publikasi
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </section>

      {/* ===== GALERI / PROGRAM (bagian konten Beranda, bukan halaman baru) ===== */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="judul-galeri">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="judul-galeri" className="text-2xl">Program &amp; kegiatan</h2>
          <ContohBadge />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Pendidikan & belajar", d: "Pendampingan belajar sore, kelas mengaji, bimbingan jenjang SMP–PT." },
            { t: "Gizi & kesehatan", d: "Jadwal makan bergizi, pemeriksaan kesehatan berkala bersama puskesmas." },
            { t: "Keterampilan hidup", d: "Latihan kemandirian harian: mencuci, kebersihan diri, mengelola uang saku." },
            { t: "Sosial & seni", d: "Pentas seni, kunjungan komunitas, kegiatan kebersamaan antarwarga." },
          ].map((p) => (
            <div key={p.t} className="rounded-xl border border-brand-100 bg-white p-4">
              <PhotoPlaceholder tinggi="aspect-[16/10]" />
              <h3 className="mt-3 text-base">{p.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-body-text">{p.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Foto asli kegiatan masih menunggu kiriman pengurus; kartu di atas memakai placeholder.
        </p>
      </section>

      {/* ===== CTA DONASI (merah #AD4A4A) ===== */}
      <section className="bg-brand-700" aria-labelledby="judul-cta">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="judul-cta" className="text-2xl text-white">Mau ikut membantu?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-100">
              Donasi dikirim lewat transfer bank/QRIS di luar website. Setelah mentransfer, isi
              formulir konfirmasi; petugas berwenang memeriksanya secara manual. Pesan yang
              ditampilkan hanya menyatakan diterima dan menunggu pemeriksaan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => pindah("donasi")}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg bg-cta-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-600"
          >
            <HeartHandshake className="h-4 w-4" aria-hidden />
            Panduan Donasi &amp; Konfirmasi
          </button>
        </div>
      </section>
    </main>
  );
}
