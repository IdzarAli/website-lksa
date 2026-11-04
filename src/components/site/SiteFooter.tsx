"use client";

import { siteConfig, type NavKey } from "@/config/site";
import { LogoMark } from "@/components/site/LogoMark";
import { Instagram, MapPin, Mail, Phone, Youtube } from "lucide-react";

/**
 * Footer gelap #21262C, menempel di bawah saat konten pendek (mt-auto pada
 * wrapper shell) dan terdorong natural saat konten panjang.
 */
export function SiteFooter({ pindah }: { pindah: (tujuan: NavKey) => void }) {
  const k = siteConfig.kontak;
  return (
    <footer className="mt-auto bg-footer text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            {/* Latar putih agar logo kontras di atas footer gelap */}
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1">
              <LogoMark className="h-9 w-9" />
            </span>
            <span className="font-display text-lg">{siteConfig.namaLembaga}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-300">
            {siteConfig.namaResmi} di {siteConfig.lokasi}. Berdiri{" "}
            {siteConfig.tanggalBerdiri} — &ldquo;{siteConfig.motto}&rdquo;.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-200">
            Kontak
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{k.alamat}</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <a href={`mailto:${k.email}`} className="transition-colors hover:text-white">
                {k.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <a
                href={`https://wa.me/${k.hpIntl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                HP/WA {k.hp}
              </a>
            </li>
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <a
              href={`https://instagram.com/${k.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${siteConfig.namaLembaga}: ${k.instagram}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-gray-300 transition-colors hover:border-white/40 hover:text-white"
            >
              <Instagram className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="https://www.youtube.com/@lksadanukusumo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`YouTube ${siteConfig.namaLembaga}: ${k.youtube}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-gray-300 transition-colors hover:border-white/40 hover:text-white"
            >
              <Youtube className="h-4 w-4" aria-hidden />
            </a>
            <span className="text-xs text-gray-400">
              IG {k.instagram} · YT {k.youtube}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-200">
            Navigasi
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {siteConfig.navigasi.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => pindah(item.key)}
                  className="rounded text-gray-300 transition-colors hover:text-white"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-gray-400 sm:px-6">
          © {new Date().getFullYear()} {siteConfig.copyright}
        </div>
      </div>
    </footer>
  );
}
