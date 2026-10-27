"use client";

import { siteConfig, type NavKey } from "@/config/site";
import { LogoMark } from "@/components/site/LogoMark";
import { HeartHandshake } from "lucide-react";

/**
 * Header + navigasi ENAM tujuan (spesifikasi §1):
 * - Desktop: horizontal
 * - Mobile: DUA BARIS tujuan (grid), BUKAN hamburger
 * - Donasi diberi gaya CTA merah (#AD4A4A)
 */
export function SiteHeader({
  aktif,
  pindah,
}: {
  aktif: string;
  pindah: (tujuan: NavKey) => void;
}) {
  const items = siteConfig.navigasi;
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => pindah("beranda")}
          className="flex items-center gap-3 rounded-md text-left"
          aria-label={`${siteConfig.namaLembaga} — kembali ke Beranda`}
        >
          <LogoMark className="h-10 w-10 shrink-0" />
          <span>
            <span className="block font-display text-base leading-tight text-ink sm:text-lg">
              {siteConfig.namaLembaga}
            </span>
            <span className="block text-xs text-muted-foreground">
              {siteConfig.lokasi}
            </span>
          </span>
        </button>
        {/* CTA donasi selalu tampak di kanan atas (merah #AD4A4A) */}
        <button
          type="button"
          onClick={() => pindah("donasi")}
          className="hidden items-center gap-2 rounded-lg bg-cta-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cta-600 md:inline-flex"
        >
          <HeartHandshake className="h-4 w-4" aria-hidden />
          Kirim Konfirmasi Donasi
        </button>
      </div>

      {/* Navigasi enam tujuan — mobile: dua baris (3 × 2), bukan hamburger; desktop: satu baris */}
      <nav aria-label="Navigasi utama" className="border-t border-brand-100 bg-brand-50/60">
        <ul className="mx-auto grid max-w-6xl grid-cols-3 gap-1 px-2 py-2 sm:px-4 md:flex md:justify-center md:gap-1">
          {items.map((item) => {
            const aktifItem = aktif === item.key;
            const donasi = item.key === "donasi";
            return (
              <li key={item.key} className="md:mx-0.5">
                <button
                  type="button"
                  onClick={() => pindah(item.key)}
                  aria-current={aktifItem ? "page" : undefined}
                  className={`flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-[13px] font-semibold leading-tight transition-colors md:min-h-[40px] md:w-auto md:text-sm ${
                    aktifItem
                      ? donasi
                        ? "bg-cta-500 text-white"
                        : "bg-brand-600 text-white"
                      : donasi
                        ? "bg-cta-50 text-cta-700 hover:bg-cta-100"
                        : "text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  {donasi && <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden />}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
