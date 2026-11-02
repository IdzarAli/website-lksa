"use client";

import { useEffect, useState } from "react";
import { siteConfig, type NavKey } from "@/config/site";
import { LogoMark } from "@/components/site/LogoMark";
import { HeartHandshake, Home, Info, Newspaper, UsersRound, Wrench } from "lucide-react";

const IKON_NAV: Record<NavKey, React.ComponentType<{ className?: string }>> = {
  beranda: Home,
  tentang: Info,
  informasi: Newspaper,
  data: UsersRound,
  donasi: HeartHandshake,
  sewa: Wrench,
};

export function SiteHeader({
  aktif,
  pindah,
}: {
  aktif: string;
  pindah: (tujuan: NavKey) => void;
}) {
  const items = siteConfig.navigasi;
  const [berscroll, setBerscroll] = useState(false);

  useEffect(() => {
    const padaScroll = () => setBerscroll(window.scrollY > 8);
    const raf = requestAnimationFrame(padaScroll);
    window.addEventListener("scroll", padaScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", padaScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-brand-200 bg-gradient-to-r from-brand-700 to-brand-600 transition-shadow duration-300 ${
        berscroll ? "shadow-md" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <button
          type="button"
          onClick={() => pindah("beranda")}
          className="flex items-center gap-2 rounded-md text-left"
          aria-label={`${siteConfig.namaLembaga} — kembali ke Beranda`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-1">
            <LogoMark className="h-7 w-7" />
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-sm leading-tight text-white">{siteConfig.namaLembaga}</span>
            <span className="block text-[11px] text-brand-100">{siteConfig.lokasi}</span>
          </span>
        </button>

        <nav aria-label="Navigasi utama" className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const aktifItem = aktif === item.key;
            const donasi = item.key === "donasi";
            const Ikon = IKON_NAV[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => pindah(item.key)}
                aria-current={aktifItem ? "page" : undefined}
                className={`inline-flex min-h-[32px] shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors sm:min-h-[36px] sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-xs md:text-sm ${
                  aktifItem
                    ? donasi
                      ? "bg-white text-brand-700"
                      : "bg-brand-800 text-white"
                    : donasi
                      ? "bg-brand-500 text-white hover:bg-brand-400"
                      : "text-brand-100 hover:bg-brand-500 hover:text-white"
                }`}
              >
                {donasi && <HeartHandshake className="h-3 w-3 shrink-0" aria-hidden />}
                {Ikon && !donasi && <Ikon className="h-3 w-3 shrink-0" aria-hidden />}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
