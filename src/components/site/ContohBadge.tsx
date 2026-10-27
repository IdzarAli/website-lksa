/** Lencana kecil "CONTOH" — menandai angka/tarif/data yang belum resmi. */
export function ContohBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-800 ${className}`}
      title="Data contoh untuk prototipe — bukan data resmi lembaga"
    >
      Contoh
    </span>
  );
}
