"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Megaphone, Search, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

/**
 * Informasi & Publikasi (PRD-012) + Detail berita (PRD-016).
 * Filter (pencarian + tahun publikasi + halaman) HIDUP di komponen ini, sehingga
 * tombol "Kembali ke daftar" dari detail menjaga filter/halaman (PRD-016).
 */
interface ArtikelList {
  id: string;
  slug: string;
  judul: string;
  ringkasan: string;
  kategori: string;
  mediaUrl: string | null;
  mediaAlt: string | null;
  publicationConsent: boolean;
  publishedAt: string | null;
}
interface ArtikelDetail extends ArtikelList {
  isi: string;
  status: string;
}
interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  kategori: string;
  prioritas: string;
  publishedAt: string | null;
}

function tgl(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function InformasiView({
  slug,
  bukaBerita,
  kembaliKeDaftar,
}: {
  slug: string | null;
  bukaBerita: (slug: string) => void;
  kembaliKeDaftar: () => void;
}) {
  // ===== state daftar (dipertahankan saat melihat detail) =====
  const [q, setQ] = useState("");
  const [tahun, setTahun] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [data, setData] = useState<{ items: ArtikelList[]; total: number; totalPages: number; years: string[] } | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);

  // ===== state detail (muatan per slug; diturunkan agar tak ada setState sinkron di efek) =====
  const [muatanDetail, setMuatanDetail] = useState<{ slug: string; detail: ArtikelDetail | null; tidakAda: boolean } | null>(null);
  const detailAktif = slug !== null && muatanDetail?.slug === slug ? muatanDetail.detail : null;
  const detailTidakAda = slug !== null && muatanDetail?.slug === slug ? muatanDetail.tidakAda : false;
  const detailMemuat = slug !== null && muatanDetail?.slug !== slug;

  // muat daftar saat filter berubah (bukan saat slug berubah);
  // setState hanya di callback async (bukan sinkron di dalam efek)
  useEffect(() => {
    if (slug) return;
    let aktif = true;
    const params = new URLSearchParams({ page: String(halaman) });
    if (q) params.set("q", q);
    if (tahun) params.set("year", tahun);
    fetch(`/api/articles?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (aktif) {
          setData(d);
          setMemuat(false);
        }
      })
      .catch(() => {
        if (aktif) setMemuat(false);
      });
    return () => {
      aktif = false;
    };
  }, [slug, q, tahun, halaman]);

  // muat pengumuman sekali
  useEffect(() => {
    let aktif = true;
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => {
        if (aktif) setPengumuman(d.items ?? []);
      })
      .catch(() => {
        /* diamkan */
      });
    return () => {
      aktif = false;
    };
  }, []);

  // muat detail saat slug ada (setState hanya di callback async)
  useEffect(() => {
    if (!slug) return;
    let aktif = true;
    fetch(`/api/articles/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("404");
        return r.json();
      })
      .then((d) => {
        if (aktif) setMuatanDetail({ slug, detail: d.item, tidakAda: false });
      })
      .catch(() => {
        if (aktif) setMuatanDetail({ slug, detail: null, tidakAda: true });
      });
    return () => {
      aktif = false;
    };
  }, [slug]);

  // pencarian: reset ke halaman 1 saat kata kunci berubah
  const cari = (nilai: string) => {
    setQ(nilai);
    setHalaman(1);
    setMemuat(true);
  };

  const gantiTahun = (nilai: string) => {
    setTahun(nilai);
    setHalaman(1); // ganti filter tahun → halaman 1
    setMemuat(true);
  };

  const bersihkanFilter = () => {
    setQ("");
    setTahun("");
    setHalaman(1);
    setMemuat(true);
  };

  // ================= DETAIL (PRD-016) =================
  if (slug) {
    return (
      <main id="konten" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          type="button"
          onClick={kembaliKeDaftar}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Kembali ke daftar
        </button>

        {detailMemuat && (
          <div className="mt-8 space-y-3" aria-busy="true" aria-live="polite">
            <div className="h-8 w-3/4 animate-pulse rounded bg-brand-50" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-brand-50" />
            <div className="h-64 w-full animate-pulse rounded bg-brand-50" />
            <p className="sr-only">Memuat berita…</p>
          </div>
        )}

        {detailTidakAda && !detailMemuat && (
          <div className="mt-10 rounded-xl border border-cta-100 bg-cta-50 p-8 text-center" role="alert">
            <XCircle className="mx-auto h-8 w-8 text-cta-500" aria-hidden />
            <h1 className="mt-3 text-xl">Berita tidak ditemukan</h1>
            <p className="mt-2 text-sm text-body-text">
              Berita mungkin belum terbit, sudah ditarik, atau tautan salah.
            </p>
            <button
              type="button"
              onClick={kembaliKeDaftar}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Kembali ke daftar
            </button>
          </div>
        )}

        {detailAktif && (
          <article className="mt-6">
            <h1 className="text-2xl leading-snug sm:text-3xl">{detailAktif.judul}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                {detailAktif.kategori}
              </span>
              <time dateTime={detailAktif.publishedAt ?? undefined}>{tgl(detailAktif.publishedAt)}</time>
            </p>

            {/* foto hanya tampil bila publicationConsent = true (PRD-016) */}
            {detailAktif.publicationConsent && detailAktif.mediaUrl ? (
              <img
                src={detailAktif.mediaUrl}
                alt={detailAktif.mediaAlt || `Foto berita: ${detailAktif.judul}`}
                className="mt-5 w-full rounded-xl border border-brand-100 object-cover"
              />
            ) : (
              <img
                src="/images/belajar.jpg"
                alt={`Foto berita: ${detailAktif.judul}`}
                className="mt-5 w-full rounded-xl border border-brand-100 object-cover"
              />
            )}

            {/* isi disanitasi: dirender sebagai markdown TANPA raw HTML */}
            <div className="prose-brand mt-6 space-y-4 text-base leading-relaxed text-body-text">
              <ReactMarkdown
                components={{
                  a: (props) => <a {...props} rel="noopener noreferrer nofollow" />,
                }}
              >
                {detailAktif.isi}
              </ReactMarkdown>
            </div>
          </article>
        )}
      </main>
    );
  }

  // ================= DAFTAR (PRD-012) =================
  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
        Informasi &amp; Publikasi
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Kabar, kegiatan, dan pengumuman</h1>

      {/* pencarian + filter tahun publikasi (bisa digabung) */}
      <form
        className="mt-6 flex flex-col gap-3 rounded-xl border border-brand-100 bg-white p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => e.preventDefault()}
        role="search"
        aria-label="Cari informasi"
      >
        <div className="flex-1">
          <label htmlFor="cari-informasi" className="mb-1 block text-sm font-semibold">
            Cari
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              id="cari-informasi"
              type="search"
              value={q}
              onChange={(e) => cari(e.target.value)}
              placeholder="Kata kunci judul, ringkasan, atau isi…"
              className="w-full rounded-lg border border-input bg-white py-2.5 pl-9 pr-3 text-sm focus-visible:outline-none"
            />
          </div>
        </div>
        <div className="sm:w-64">
          <label htmlFor="tahun-informasi" className="mb-1 block text-sm font-semibold">
            Tahun publikasi
          </label>
          <select
            id="tahun-informasi"
            value={tahun}
            onChange={(e) => gantiTahun(e.target.value)}
            className="w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm focus-visible:outline-none"
          >
            <option value="">Semua tahun</option>
            {(data?.years ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {(q || tahun) && (
          <button
            type="button"
            onClick={bersihkanFilter}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            <XCircle className="h-4 w-4" aria-hidden />
            Hapus filter
          </button>
        )}
      </form>

      {/* hasil */}
      <section className="mt-6" aria-labelledby="judul-hasil" aria-live="polite">
        <h2 id="judul-hasil" className="sr-only">Daftar berita</h2>
        {memuat && <p className="py-8 text-center text-sm text-muted-foreground">Memuat informasi…</p>}

        {!memuat && data && data.items.length === 0 && (
          <div className="rounded-xl border border-brand-100 bg-white p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-base font-semibold">Informasi belum ditemukan. Coba kata kunci lain.</p>
            <button
              type="button"
              onClick={bersihkanFilter}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Hapus filter pencarian dan tahun
            </button>
          </div>
        )}

        {!memuat && data && data.items.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              {data.total} berita ditemukan
              {q ? ` untuk “${q}”` : ""}
              {tahun ? ` pada tahun ${tahun}` : ""}
            </p>
            <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((a) => (
                <li key={a.id}>
                  <article className="flex h-full flex-col rounded-xl border border-brand-100 bg-white p-4 transition-shadow hover:shadow-md">
                    {a.publicationConsent && a.mediaUrl ? (
                      <img src={a.mediaUrl} alt={a.mediaAlt || `Foto berita: ${a.judul}`} className="aspect-[16/10] w-full rounded-lg object-cover" />
                    ) : (
                      <img src="/images/belajar.jpg" alt={`Foto berita: ${a.judul}`} className="aspect-[16/10] w-full rounded-lg object-cover" />
                    )}
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
                      {a.kategori} · <time dateTime={a.publishedAt ?? undefined}>{tgl(a.publishedAt)}</time>
                    </p>
                    <h3 className="mt-1 text-base leading-snug">
                      <button
                        type="button"
                        onClick={() => bukaBerita(a.slug)}
                        className="rounded text-left font-semibold underline-offset-4 hover:underline"
                      >
                        {a.judul}
                      </button>
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-body-text">{a.ringkasan}</p>
                  </article>
                </li>
              ))}
            </ul>

            {/* pagination yang menjaga filter */}
            {data.totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Navigasi halaman">
                <button
                  type="button"
                  disabled={halaman <= 1}
                  onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Sebelumnya
                </button>
                <span className="px-2 text-sm font-semibold" aria-current="page">
                  Halaman {halaman} dari {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={halaman >= data.totalPages}
                  onClick={() => setHalaman((h) => Math.min(data.totalPages, h + 1))}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  aria-label="Halaman berikutnya"
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* pengumuman */}
      <section className="mt-10" aria-labelledby="judul-pengumuman">
        <h2 id="judul-pengumuman" className="flex items-center gap-2 text-2xl">
          <Megaphone className="h-5 w-5 text-brand-600" aria-hidden />
          Pengumuman
        </h2>
        <ul className="mt-4 space-y-3">
          {pengumuman.length === 0 && (
            <li className="rounded-xl border border-brand-100 bg-white p-4 text-sm text-muted-foreground">
              Belum ada pengumuman terbit.
            </li>
          )}
          {pengumuman.map((p) => (
            <li key={p.id} className="rounded-xl border border-brand-100 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{p.judul}</h3>
                {p.prioritas === "penting" && (
                  <span className="rounded-full border border-cta-100 bg-cta-50 px-2 py-0.5 text-xs font-semibold text-cta-700">
                    Penting
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-body-text">{p.isi}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {p.kategori} · <time dateTime={p.publishedAt ?? undefined}>{tgl(p.publishedAt)}</time>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
