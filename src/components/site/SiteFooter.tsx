"use client";

import { siteConfig, type NavKey } from "@/config/site";
import { LogoMark } from "@/components/site/LogoMark";
import { MapPin, Mail, Phone, Clock3, ShieldAlert } from "lucide-react";

/**
 * Footer gelap #21262C, menempel di bawah saat konten pendek (mt-auto pada
 * wrapper shell) dan terdorong natural saat konten panjang.
 */
export function SiteFooter({
  pindah,
  bukaAdmin,
}: {
  pindah: (tujuan: NavKey) => void;
  bukaAdmin: () => void;
}) {
  const k = siteConfig.kontak;
  return (
    <footer className="mt-auto bg-footer text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <span className="font-display text-lg">{siteConfig.namaLembaga}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-300">
            Lembaga kesejahteraan sosial anak di {siteConfig.lokasi}. Berdiri{" "}
            {siteConfig.tahunBerdiri}, mendampingi anak binaan belajar, tumbuh, dan mandiri.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/5 p-3 text-xs leading-relaxed text-gray-300">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {siteConfig.footerCatatan}
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
              <span>{k.email}</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{k.wa}</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{k.jamLayanan}</span>
            </li>
          </ul>
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
                  className="rounded text-gray-300 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={bukaAdmin}
            className="mt-4 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:bg-white/10"
          >
            Masuk Ruang Pengurus (dashboard)
          </button>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-gray-400 sm:px-6">
          © {new Date().getFullYear()} {siteConfig.namaLembaga}. Donasi diproses
          dengan verifikasi manual di luar website; situs ini tidak menerima pembayaran
          langsung dan tidak mengunci jadwal persewaan.
        </div>
      </div>
    </footer>
  );
}
