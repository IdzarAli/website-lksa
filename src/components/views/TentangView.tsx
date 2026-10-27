"use client";

import { Eye, History, PlayCircle, Target } from "lucide-react";
import { PhotoPlaceholder } from "@/components/site/PhotoPlaceholder";

/**
 * Tentang Kami (PRD-011). Urutan konten: sejarah → visi-misi → video profil.
 * Narasi sejarah berstatus menunggu pengesahan (OD-08); video punya pesan
 * alternatif/transkrip karena belum ada aset video resmi.
 */
export function TentangView() {
  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Tentang Kami</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Mengenal LKSA / PAYM Danukusumo</h1>

      {/* ===== SEJARAH (menunggu pengesahan — OD-08) ===== */}
      <section className="mt-8" aria-labelledby="judul-sejarah">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="judul-sejarah" className="flex items-center gap-2 text-2xl">
            <History className="h-5 w-5 text-brand-600" aria-hidden />
            Sejarah singkat
          </h2>
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            Menunggu pengesahan pengurus
          </span>
        </div>
        <div className="mt-4 rounded-xl border border-brand-100 bg-white p-5 leading-relaxed text-body-text">
          <p>
            Lembaga berada di {`Purworejo, Jawa Tengah`} dan berdiri tahun{" "}
            <strong>2000 (menunggu pengesahan)</strong>. Narasi sejarah panjang — latar
            pendirian, perjalanan legalitas, dan susunan pengurus — masih disusun ulang oleh
            pengurus sebelum diterbitkan sebagai teks final (OD-08). Ringkasan di halaman ini
            tidak boleh dikutip sebagai pernyataan resmi lembaga.
          </p>
          <p className="mt-3">
            Kegiatan harian lembaga meliputi pendampingan pendidikan, pemenuhan gizi, layanan
            kesehatan dasar, dan pembinaan keterampilan mandiri bagi anak binaan.
          </p>
        </div>
      </section>

      {/* ===== VISI-MISI ===== */}
      <section className="mt-8" aria-labelledby="judul-visimisi">
        <h2 id="judul-visimisi" className="flex items-center gap-2 text-2xl">
          <Target className="h-5 w-5 text-brand-600" aria-hidden />
          Visi &amp; misi
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg">
              <Eye className="h-4 w-4 text-brand-600" aria-hidden />
              Visi
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-body-text">
              Menjadi lembaga kesejahteraan sosial anak yang amanah, terbuka datanya, dan
              berpihak pada tumbuh-kembang anak binaan di Purworejo.{" "}
              <span className="text-xs text-muted-foreground">
                (Redaksi visi masih menunggu pengesahan pengurus — OD-08.)
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-5">
            <h3 className="text-lg">Misi</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-body-text">
              <li>Menyediakan lingkungan asuh yang aman, tertib, dan mendidik.</li>
              <li>Mendampingi pendidikan formal dan keterampilan hidup sehari-hari.</li>
              <li>Mengelola donasi dengan pemeriksaan manual dan pencatatan yang dapat diaudit.</li>
              <li>Menerbitkan data agregat lembaga secara terbuka tanpa identitas individu anak.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== VIDEO PROFIL (placeholder + pesan alternatif) ===== */}
      <section className="mt-8" aria-labelledby="judul-video">
        <h2 id="judul-video" className="text-2xl">Video profil</h2>
        <div className="mt-4 rounded-xl border border-brand-100 bg-white p-5">
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand-300 bg-brand-50 p-6 text-center">
            <PlayCircle className="h-10 w-10 text-brand-600" aria-hidden />
            <p className="max-w-md text-sm font-medium text-brand-800">
              Video profil belum tersedia. {`Menunggu kiriman video asli dari pengurus.`}
            </p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              Pesan alternatif/transkrip: &ldquo;Video profil lembaga akan menampilkan suasana
              asuh, fasilitas, dan penutur dari pengurus. Saat video belum tersedia, silakan
              membaca profil singkat pada bagian sejarah dan visi-misi di halaman ini.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ===== GAMBAR SUASANA (placeholder, bukan foto stok) ===== */}
      <section className="mt-8" aria-labelledby="judul-suasana">
        <h2 id="judul-suasana" className="text-2xl">Suasana lembaga</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PhotoPlaceholder tinggi="aspect-[4/3]" label="FOTO GEDUNG ASLI (menunggu dari pengurus)" />
          <PhotoPlaceholder tinggi="aspect-[4/3]" label="FOTO RUANG BELAJAR ASLI (menunggu dari pengurus)" />
          <PhotoPlaceholder tinggi="aspect-[4/3]" label="FOTO KEGIATAN ASLI (menunggu dari pengurus)" />
        </div>
      </section>
    </main>
  );
}
