import type { Metadata } from "next";
import { Manrope, Tiro_Gurmukhi } from "next/font/google";
import "./globals.css";

// Font judul serif "Tiro Gurmukhi" (fallback serif di CSS) + isi "Manrope"
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const tiroGurmukhi = Tiro_Gurmukhi({
  variable: "--font-tiro",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "LKSA Danukusumo — Purworejo",
  description:
    "Situs resmi LKSA Danukusumo Purworejo: profil lembaga, informasi & publikasi, data agregat panti, konfirmasi donasi, dan permohonan persewaan.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${tiroGurmukhi.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
