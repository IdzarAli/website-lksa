"use client";

import { Eye, History, Quote, ScrollText, Target } from "lucide-react";
import { siteConfig } from "@/config/site";

/**
 * Tentang Kami. Urutan konten: profil resmi + motto → sejarah → visi-misi →
 * suasana lembaga. Seluruh narasi memakai data resmi lembaga (siteConfig).
 */
export function TentangView() {
  return (
    <main id="konten" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Tentang Kami</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Mengenal LKSA Danukusumo</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-body-text">
        {siteConfig.namaResmi} — Banyuurip, Purworejo.
      </p>

      {/* ===== MOTTO ===== */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-5">
        <Quote className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" aria-hidden />
        <div>
          <p className="font-display text-xl text-brand-800 sm:text-2xl">
            &ldquo;{siteConfig.motto}&rdquo;
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Motto lembaga
          </p>
        </div>
      </div>

      {/* ===== SEJARAH ===== */}
      <section className="mt-8" aria-labelledby="judul-sejarah">
        <h2 id="judul-sejarah" className="flex items-center gap-2 text-2xl">
          <History className="h-5 w-5 text-brand-600" aria-hidden />
          Sejarah singkat
        </h2>
        <div className="mt-4 rounded-xl border border-brand-100 bg-white p-5 leading-relaxed text-body-text">
          <p>
            {siteConfig.namaResmi} merupakan salah satu panti asuhan swasta di Kabupaten
            Purworejo, Jawa Tengah. Berdiri pada tanggal <strong>{siteConfig.tanggalBerdiri}</strong>,
            panti kami memiliki asrama dengan <strong>10 kamar putra dan putri</strong> berdaya
            tampung maksimal <strong>40 anak</strong>.
          </p>
          <p className="mt-3">
            Pada saat ini mengasuh <strong>34 anak</strong> yang berasal dari berbagai wilayah di
            Kabupaten Purworejo, dan beberapa anak yang berasal dari luar Purworejo. Mereka
            menempuh pendidikan formal mulai dari SD, SMP, SMA/SMK hingga Perguruan Tinggi,
            baik negeri maupun swasta.
          </p>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Berdiri</dt>
            <dd className="mt-1 font-display text-lg text-brand-800">{siteConfig.tanggalBerdiri}</dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Asrama</dt>
            <dd className="mt-1 font-display text-lg text-brand-800">10 kamar putra &amp; putri</dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daya tampung</dt>
            <dd className="mt-1 font-display text-lg text-brand-800">Maks. 40 anak</dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Anak binaan saat ini</dt>
            <dd className="mt-1 font-display text-lg text-brand-800">34 anak</dd>
          </div>
        </dl>
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
              Terwujudnya Panti Asuhan/LKSA berbasis semi pesantren yang akan melahirkan
              Generasi Rabbani yang lurus aqidahnya, cerdas, terampil, dan berakhlak mulia.
            </p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg">
              <ScrollText className="h-4 w-4 text-brand-600" aria-hidden />
              Misi
            </h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-body-text">
              <li>Meletakan dasar Aqidah, Ibadah, dan Akhlaqul Karimah dengan layanan semi pesantren.</li>
              <li>Memberikan layanan asuhan sesuai dengan hak-hak anak.</li>
              <li>Memberikan layanan pendidikan formal sampai dengan tingkat SMA/SMK sederajat.</li>
              <li>Optimalisasi potensi anak asuh sesuai bakat dan minatnya.</li>
              <li>Menjadikan panti asuhan sebagai laboratorium kader persyarikatan, agama, dan bangsa yang berkualitas.</li>
              <li>Meningkatkan kemampuan kelembagaan dan pelayanan panti.</li>
            </ol>
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

      {/* ===== KONTAK RESMI ===== */}
      <section className="mt-8" aria-labelledby="judul-kontak-resmi">
        <h2 id="judul-kontak-resmi" className="text-2xl">Kontak resmi</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-white p-5 text-sm leading-relaxed text-body-text">
            <h3 className="text-base">Alamat &amp; kontak</h3>
            <p className="mt-2">{siteConfig.kontak.alamat}</p>
            <p className="mt-1">
              HP/WA:{" "}
              <a
                href={`https://wa.me/${siteConfig.kontak.hpIntl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {siteConfig.kontak.hp}
              </a>
            </p>
            <p className="mt-1">
              Email:{" "}
              <a
                href={`mailto:${siteConfig.kontak.email}`}
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {siteConfig.kontak.email}
              </a>
            </p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white p-5 text-sm leading-relaxed text-body-text">
            <h3 className="text-base">Media sosial</h3>
            <p className="mt-2">
              Instagram:{" "}
              <a
                href={`https://instagram.com/${siteConfig.kontak.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {siteConfig.kontak.instagram}
              </a>
            </p>
            <p className="mt-1">
              YouTube:{" "}
              <a
                href="https://www.youtube.com/@lksadanukusumo"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {siteConfig.kontak.youtube}
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
