"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { siteConfig, type NavKey } from "@/config/site";
import { LogoMark } from "@/components/site/LogoMark";
import {
  HeartHandshake,
  Home,
  Info,
  Menu,
  Newspaper,
  UsersRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Header responsif:
 * - Desktop (md+): logo + navigasi horizontal + CTA donasi (perilaku lama).
 * - Mobile (<md): tombol hamburger membuka panel menu DINAMIS —
 *   animasi slide (framer-motion), backdrop, tutup via Escape/klik luar/
 *   memilih tujuan, kunci gulir tubuh saat terbuka, shadow mengikuti scroll.
 * - Donasi diberi gaya CTA merah (#AD4A4A) di semua ukuran layar.
 */

const IKON_NAV: Record<NavKey, LucideIcon> = {
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
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [berscroll, setBerscroll] = useState(false);
  const [aktifTerakhir, setAktifTerakhir] = useState(aktif);

  // Menu otomatis tertutup saat halaman berganti (penyesuaian state saat render).
  if (aktifTerakhir !== aktif) {
    setAktifTerakhir(aktif);
    setMenuTerbuka(false);
  }

  // Shadow header dinamis mengikuti posisi gulir.
  useEffect(() => {
    const padaScroll = () => setBerscroll(window.scrollY > 8);
    const raf = requestAnimationFrame(padaScroll);
    window.addEventListener("scroll", padaScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", padaScroll);
    };
  }, []);

  // Saat menu terbuka: kunci gulir tubuh + tutup dengan Escape.
  useEffect(() => {
    if (!menuTerbuka) return;
    const padaTombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuTerbuka(false);
    };
    document.addEventListener("keydown", padaTombol);
    const gulirLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", padaTombol);
      document.body.style.overflow = gulirLama;
    };
  }, [menuTerbuka]);

  const tuju = (k: NavKey) => {
    setMenuTerbuka(false);
    pindah(k);
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b border-brand-100 bg-white transition-shadow duration-300 ${
        berscroll || menuTerbuka ? "shadow-md" : ""
      }`}
    >
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => tuju("beranda")}
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

        {/* CTA donasi desktop (kanan atas) */}
        <button
          type="button"
          onClick={() => tuju("donasi")}
          className="hidden items-center gap-2 rounded-lg bg-cta-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cta-600 md:inline-flex"
        >
          <HeartHandshake className="h-4 w-4" aria-hidden />
          Kirim Konfirmasi Donasi
        </button>

        {/* Hamburger mobile */}
        <button
          type="button"
          onClick={() => setMenuTerbuka((v) => !v)}
          aria-expanded={menuTerbuka}
          aria-controls="menu-mobile"
          aria-label={menuTerbuka ? "Tutup menu navigasi" : "Buka menu navigasi"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-brand-800 transition-colors hover:bg-brand-50 md:hidden"
        >
          {menuTerbuka ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {/* Navigasi desktop — satu baris horizontal */}
      <nav
        aria-label="Navigasi utama"
        className="hidden border-t border-brand-100 bg-brand-50/60 md:block"
      >
        <ul className="mx-auto flex max-w-6xl justify-center gap-1 px-4 py-2 sm:px-6">
          {items.map((item) => {
            const aktifItem = aktif === item.key;
            const donasi = item.key === "donasi";
            return (
              <li key={item.key} className="mx-0.5">
                <button
                  type="button"
                  onClick={() => tuju(item.key)}
                  aria-current={aktifItem ? "page" : undefined}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
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

      {/* ===== MENU MOBILE (drawer dinamis) ===== */}
      <AnimatePresence>
        {menuTerbuka && (
          <>
            {/* Backdrop — di bawah latar header, menutupi konten halaman */}
            <motion.button
              key="backdrop"
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMenuTerbuka(false)}
              className="fixed inset-0 -z-10 bg-ink/45 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.nav
              key="panel"
              id="menu-mobile"
              aria-label="Menu navigasi"
              className="absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto border-b border-brand-100 bg-white shadow-xl md:hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <ul className="space-y-1 px-3 py-3">
                {items.map((item) => {
                  const aktifItem = aktif === item.key;
                  const donasi = item.key === "donasi";
                  const Ikon = IKON_NAV[item.key];
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => tuju(item.key)}
                        aria-current={aktifItem ? "page" : undefined}
                        className={`flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                          aktifItem
                            ? donasi
                              ? "bg-cta-50 text-cta-700"
                              : "bg-brand-50 text-brand-800"
                            : "text-ink hover:bg-muted"
                        }`}
                      >
                        <Ikon
                          className={`h-5 w-5 shrink-0 ${
                            donasi ? "text-cta-500" : "text-brand-600"
                          }`}
                          aria-hidden
                        />
                        <span className="flex-1">{item.label}</span>
                        {aktifItem && (
                          <span
                            aria-hidden
                            className="h-2 w-2 shrink-0 rounded-full bg-brand-600"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-border px-3 py-3">
                <button
                  type="button"
                  onClick={() => tuju("donasi")}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-cta-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-600"
                >
                  <HeartHandshake className="h-4 w-4" aria-hidden />
                  Kirim Konfirmasi Donasi
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
