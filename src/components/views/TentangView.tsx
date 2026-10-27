"use client";

import { Eye, History, Target } from "lucide-react";

/**
 * Tentang Kami. Urutan konten: sejarah → visi-misi → suasana lembaga.
 */
export function TentangView() {
  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Tentang Kami</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Mengenal LKSA Danukusumo</h1>

      {/* ===== SEJARAH ===== */}
      <section className="mt-8" aria-labelledby="judul-sejarah">
        <h2 id="judul-sejarah" className="flex items-center gap-2 text-2xl">
          <History className="h-5 w-5 text-brand-600" aria-hidden />
          Sejarah singkat
        </h2>
        <div className="mt-4 rounded-xl border border-brand-100 bg-white p-5 leading-relaxed text-body-text">
          <p>
            Lembaga berada di Purworejo, Jawa Tengah dan berdiri tahun <strong>2000</strong>.
            Selama lebih dari dua dekade, lembaga mendampingi anak binaan untuk tetap dapat
            bersekolah, tumbuh sehat, dan berkembang mandiri di tengah keluarga asuh lembaga.
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
              berpihak pada tumbuh-kembang anak binaan di Purworejo.
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

      {/* ===== SUASANA LEMBAGA ===== */}
      <section className="mt-8" aria-labelledby="judul-suasana">
        <h2 id="judul-suasana" className="text-2xl">Suasana lembaga</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <figure className="overflow-hidden rounded-xl border border-brand-100 bg-white">
            <img src="/images/gedung.jpg" alt="Gedung asrama lembaga" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="p-3 text-sm font-medium text-body-text">Gedung asrama</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-xl border border-brand-100 bg-white">
            <img src="/images/belajar.jpg" alt="Ruang belajar anak binaan" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="p-3 text-sm font-medium text-body-text">Ruang belajar</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-xl border border-brand-100 bg-white">
            <img src="/images/seni.jpg" alt="Kegiatan seni dan kebersamaan anak binaan" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="p-3 text-sm font-medium text-body-text">Kegiatan bersama</figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
