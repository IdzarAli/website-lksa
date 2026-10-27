import { ImageOff } from "lucide-react";

/**
 * Placeholder foto wajib — TIDAK memakai foto stok/acak.
 * Teks jujur: foto asli menunggu kiriman pengurus.
 */
export function PhotoPlaceholder({
  className = "",
  tinggi = "aspect-[16/9]",
  label = "FOTO KEGIATAN ASLI (menunggu dari pengurus)",
}: {
  className?: string;
  tinggi?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex ${tinggi} w-full items-center justify-center rounded-lg border border-dashed border-brand-300 bg-brand-50 p-4 text-center ${className}`}
    >
      <span className="flex flex-col items-center gap-2 text-sm font-medium text-brand-800">
        <ImageOff className="h-6 w-6" aria-hidden />
        {label}
      </span>
    </div>
  );
}
