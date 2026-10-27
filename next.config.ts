import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* Matikan indikator dev Next.js (logo di pojok kiri bawah) */
  devIndicators: false,
};

export default nextConfig;
