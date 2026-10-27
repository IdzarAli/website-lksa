"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, GraduationCap, HeartHandshake, Users, UsersRound } from "lucide-react";
import { siteConfig, type NavKey } from "@/config/site";

/**
 * Beranda. Urutan konten: hero → statistik → profil → sambutan → berita →
 * program & kegiatan → CTA donasi. Statistik dibaca dari data InstitutionStats.
 */
interface StatItem {
  periode?: string;
  sumber?: string;
  usiaAgregat?: {
    ringkasBeranda?: { nilai?: string; sumber?: string; periode?: string };
    ringkasAlumni?: { nilai?: string };
    rincian?: { label: string; jumlah: number }[];
  };
  pendidikanAgregat?: { total?: number; rincian?: { label: string; jumlah: number }[] };
  alokasi?: { rincian?: { label: string; persen: number }[] };
}
interface ArtikelRingkas {
  slug: string;
  judul: string;
  ringkasan: string;
  kategori: string;
  mediaUrl: string | null;
  publicationConsent: boolean;
  publishedAt: string | null;
}

interface StaffItem { id: string }

export function BerandaView({
  pindah,
  bukaBerita,
}: {
  pindah: (tujuan: NavKey) => void;
  bukaBerita: (slug: string) => void;
}) {
  const [stats, setStats] = useState<StatItem | null>(null);
  const [berita, setBerita] = useState<ArtikelRingkas[]>([]);
  const [staff, setStaff] = useState<StaffItem[] | null>(null);

  useEffect(() => {
    fetch("/api/institution-stats")
      .then((r) => r.json())
      .then((d) => setStats(d.item))
      .catch(() => setStats(null));
    fetch("/api/articles?page=1")
      .then((r) => r.json())
      .then((d) => setBerita((d.items ?? []).slice(0, 3)))
      .catch(() => setBerita([]));
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => setStaff(d.items ?? []))
      .catch(() => setStaff(null));
  }, []);

  // Nilai kartu ringkas: utamakan data, lalu jumlah rincian, terakhir nilai baku.
  const rincianUsia = stats?.usiaAgregat?.rincian;
  const nilaiAnak =
    stats?.usiaAgregat?.ringkasBeranda?.nilai ??
    (rincianUsia && rincianUsia.length > 0
      ? String(rincianUsia.reduce((a, b) => a + (b.jumlah ?? 0), 0))
      : "34");
  const nilaiAlumni = stats?.usiaAgregat?.ringkasAlumni?.nilai ?? "150+";
  const nilaiPengasuh = staff ? String(staff.length) : "3";

  return (
    <main id="konten">
      {/* ===== HERO ===== */}
      <section className="border-b border-brand-100 bg-brand-50" aria-labelledby="judul-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Lembaga Kesejahteraan Sosial Anak · Banyuurip, Purworejo, Jawa Tengah
            </p>
            <h1 id="judul-hero" className="mt-3 text-3xl leading-tight sm:text-4xl md:text-5xl">
              Mendampingi anak binaan belajar, tumbuh, dan mandiri di Purworejo
            </h1>
            <p className="mt-3 font-display text-lg text-brand-800">
              &ldquo;Berbakti Meraih Ridho Ilahi&rdquo;
            </p>
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
          <img
            src="/images/hero.jpg"
            alt="Anak binaan belajar bersama di ruang bersama lembaga"
            className="aspect-[4/3] w-full rounded-2xl border border-brand-100 object-cover shadow-sm"
          />
        </div>
      </section>

      {/* ===== STATISTIK RINGKAS (dari data, tanpa identitas individu) ===== */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-label="Statistik ringkas lembaga">
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
              <Users className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> Anak binaan
            </dt>
            <dd className="mt-2 font-display text-2xl text-brand-800 sm:text-3xl">{nilaiAnak}</dd>
            <dd className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">Anak aktif diasuh saat ini</dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
              <UsersRound className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> Pengasuh Panti
            </dt>
            <dd className="mt-2 font-display text-2xl text-brand-800 sm:text-3xl">{nilaiPengasuh}</dd>
            <dd className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">Pengasuh &amp; pendamping harian</dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
              <GraduationCap className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> Alumni
            </dt>
            <dd className="mt-2 font-display text-2xl text-brand-800 sm:text-3xl">{nilaiAlumni}</dd>
            <dd className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">Akumulasi sejak berdiri</dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> Tahun berdiri
            </dt>
            <dd className="mt-2 font-display text-2xl text-brand-800 sm:text-3xl">{siteConfig.tahunBerdiri}</dd>
            <dd className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">{siteConfig.tanggalBerdiri}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => pindah("data")}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          Lihat Pengurus Panti
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
                Berada di Banyuurip, Purworejo dan berdiri 15 Juli 2000. Panti berbasis semi
                pesantren dengan asrama 10 kamar putra dan putri, daya tampung maksimal 40 anak.
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
                rinci. Bukti donasi bersifat privat dan hanya dibuka petugas berwenang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SAMBUTAN ===== */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="judul-sambutan">
        <div className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
          <h2 id="judul-sambutan" className="text-2xl">Sambutan Kepala Pengasuhan</h2>
          <p className="mt-3 text-sm leading-relaxed text-body-text">
            &ldquo;Assalamualaikum. Kami mengucapkan terima kasih kepada para donatur dan relawan
            yang telah mendampingi anak-anak binaan kami. Setiap bantuan yang masuk kami kelola
            dengan pemeriksaan manual dan pencatatan yang dapat dipertanggungjawabkan. Silakan
            hubungi sekretariat untuk pertanyaan seputar lembaga.&rdquo;
          </p>
        </div>
      </section>

      {/* ===== BERITA ===== */}
      <section className="border-y border-brand-100 bg-brand-50/50" aria-labelledby="judul-berita">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 id="judul-berita" className="text-2xl">Kabar kegiatan terbaru</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {berita.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada berita terbit.</p>
            )}
            {berita.map((b) => (
              <article key={b.slug} className="flex flex-col rounded-xl border border-brand-100 bg-white p-4">
                <img
                  src={b.publicationConsent && b.mediaUrl ? b.mediaUrl : "/images/belajar.jpg"}
                  alt={`Foto kegiatan: ${b.judul}`}
                  className="aspect-[16/10] w-full rounded-lg object-cover"
                />
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

      {/* ===== PROGRAM & KEGIATAN ===== */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="judul-galeri">
        <h2 id="judul-galeri" className="text-2xl">Program &amp; kegiatan</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { img: "/images/belajar.jpg", alt: "Pendampingan belajar sore", t: "Pendidikan & belajar", d: "Pendampingan belajar sore, kelas mengaji, bimbingan jenjang SMP–PT." },
            { img: "/images/gizi.jpg", alt: "Makan bergizi bersama", t: "Gizi & kesehatan", d: "Jadwal makan bergizi, pemeriksaan kesehatan berkala bersama puskesmas." },
            { img: "/images/kemandirian.jpg", alt: "Latihan kemandirian harian", t: "Keterampilan hidup", d: "Latihan kemandirian harian: mencuci, kebersihan diri, mengelola uang saku." },
            { img: "/images/seni.jpg", alt: "Pentas seni anak binaan", t: "Sosial & seni", d: "Pentas seni, kunjungan komunitas, kegiatan kebersamaan antarwarga." },
          ].map((p) => (
            <div key={p.t} className="rounded-xl border border-brand-100 bg-white p-4">
              <img src={p.img} alt={p.alt} className="aspect-[16/10] w-full rounded-lg object-cover" />
              <h3 className="mt-3 text-base">{p.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-body-text">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA DONASI (merah #AD4A4A) ===== */}
      <section className="bg-brand-700" aria-labelledby="judul-cta">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="judul-cta" className="text-2xl text-white">Mau ikut membantu?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-100">
              Donasi dikirim lewat transfer bank di luar website. Setelah mentransfer, isi
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
