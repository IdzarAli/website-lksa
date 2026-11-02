import type { NextConfig } from "next";

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* Izinkan akses dev lewat 127.0.0.1 selain localhost. */
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  /* Matikan indikator dev Next.js (logo di pojok kiri bawah) */
  devIndicators: false,
  /* Jangan buat ulang AGENTS.md otomatis saat `next dev`. */
  agentRules: false,
  /* Semua panggilan /api/* diteruskan ke Django sehingga cookie sesi tetap same-origin. */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${DJANGO_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
