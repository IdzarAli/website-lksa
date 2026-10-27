"use client";

import { useCallback, useEffect, useState } from "react";
import type { NavKey } from "@/config/site";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BerandaView } from "@/components/views/BerandaView";
import { TentangView } from "@/components/views/TentangView";
import { InformasiView } from "@/components/views/InformasiView";
import { DataPantiView } from "@/components/views/DataPantiView";
import { DonasiView } from "@/components/views/DonasiView";
import { PersewaanView } from "@/components/views/PersewaanView";
import { AdminView } from "@/components/views/AdminView";

/**
 * Shell satu halaman (pratinjau hanya menayangkan route "/").
 * Navigasi memakai hash (#/beranda, #/informasi/{slug}, dst.) agar:
 * - tombol kembali browser bekerja,
 * - tautan berita bisa dibagikan,
 * - komponen per "halaman" terpisah dan mudah dipindah ke route sungguhan nanti.
 */

type Rute =
  | { view: "beranda" }
  | { view: "tentang" }
  | { view: "informasi"; slug: null }
  | { view: "informasi"; slug: string }
  | { view: "data" }
  | { view: "donasi" }
  | { view: "sewa" }
  | { view: "admin" };

function parseHash(): Rute {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const bagian = raw.split("/").filter(Boolean);
  if (bagian[0] === "tentang") return { view: "tentang" };
  if (bagian[0] === "informasi") {
    return bagian[1] ? { view: "informasi", slug: decodeURIComponent(bagian[1]) } : { view: "informasi", slug: null };
  }
  if (bagian[0] === "data") return { view: "data" };
  if (bagian[0] === "donasi") return { view: "donasi" };
  if (bagian[0] === "sewa") return { view: "sewa" };
  if (bagian[0] === "admin") return { view: "admin" };
  return { view: "beranda" };
}

export function SiteShell() {
  const [rute, setRute] = useState<Rute>({ view: "beranda" });

  useEffect(() => {
    const baca = () => setRute(parseHash());
    baca();
    window.addEventListener("hashchange", baca);
    return () => window.removeEventListener("hashchange", baca);
  }, []);

  const nav = useCallback((tujuan: NavKey) => {
    window.location.hash = `#/${tujuan}`;
  }, []);

  const bukaBerita = useCallback((slug: string) => {
    window.location.hash = `#/informasi/${encodeURIComponent(slug)}`;
  }, []);

  const kembaliKeDaftar = useCallback(() => {
    window.location.hash = "#/informasi";
  }, []);

  // gulir ke atas saat berpindah "halaman"
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [rute]);

  const aktif = rute.view === "informasi" ? "informasi" : rute.view;

  // Ruang pengurus = antarmuka TERPISAH dari situs publik:
  // tanpa header/footer situs, latar sendiri, hanya dijangkau lewat #/admin.
  if (rute.view === "admin") {
    return (
      <div className="min-h-screen bg-[#F2F5F3]">
        <AdminView kembali={() => nav("beranda")} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Langsung ke konten utama
      </a>
      <SiteHeader aktif={aktif} pindah={nav} />
      <div className="flex-1">
        {rute.view === "beranda" && <BerandaView pindah={nav} bukaBerita={bukaBerita} />}
        {rute.view === "tentang" && <TentangView />}
        {rute.view === "informasi" && (
          <InformasiView slug={"slug" in rute ? rute.slug : null} bukaBerita={bukaBerita} kembaliKeDaftar={kembaliKeDaftar} />
        )}
        {rute.view === "data" && <DataPantiView />}
        {rute.view === "donasi" && <DonasiView />}
        {rute.view === "sewa" && <PersewaanView />}
      </div>
      <SiteFooter pindah={nav} />
    </div>
  );
}
