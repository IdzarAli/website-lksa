import type { NextConfig } from "next";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.DJANGO_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* Izinkan akses dev lewat 127.0.0.1 selain localhost. */
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  /* Matikan indikator dev Next.js (logo di pojok kiri bawah) */
  devIndicators: false,
  /* Jangan buat ulang AGENTS.md otomatis saat `next dev`. */
  agentRules: false,
  /* Static export untuk GitHub Pages */
  output: "export",
  /* Images: tidak ada remote image yang dioptimasi otomatis untuk static export */
  images: {
    unoptimized: true,
  },
  /* Semua panggilan /api/* diteruskan ke backend (Django/Express) sehingga cookie sesi tetap same-origin.
     Di production (GitHub Pages), ini tidak aktif karena static export; API call harus ke absolute URL. */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
