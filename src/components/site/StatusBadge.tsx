import { BadgeCheck, Clock3, CircleAlert, FileClock, Inbox, Send, XCircle, Pencil, CheckCircle2, Wrench } from "lucide-react";

/**
 * Lencana status = TEKS + IKON (wajib, bukan warna saja — aksesibilitas).
 * INV-7: label netral dan jujur; kata "terverifikasi/disetujui" hanya muncul
 * setelah keputusan manusia tercatat.
 */
const PETA: Record<string, { label: string; ikon: React.ReactNode; kelas: string }> = {
  "menunggu-verifikasi": { label: "Menunggu verifikasi", ikon: <Clock3 className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-amber-50 text-amber-900 border-amber-300" },
  terverifikasi: { label: "Terverifikasi", ikon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-brand-50 text-brand-800 border-brand-300" },
  "perlu-perbaikan": { label: "Perlu perbaikan", ikon: <CircleAlert className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-cta-50 text-cta-700 border-cta-100" },
  ditolak: { label: "Ditolak", ikon: <XCircle className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-cta-50 text-cta-700 border-cta-500" },
  diajukan: { label: "Diajukan", ikon: <Send className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-amber-50 text-amber-900 border-amber-300" },
  ditinjau: { label: "Ditinjau", ikon: <FileClock className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-amber-50 text-amber-900 border-amber-300" },
  disetujui: { label: "Disetujui", ikon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-brand-50 text-brand-800 border-brand-300" },
  draf: { label: "Draf", ikon: <Pencil className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-muted text-muted-foreground border-border" },
  "menunggu-persetujuan": { label: "Menunggu persetujuan", ikon: <Clock3 className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-amber-50 text-amber-900 border-amber-300" },
  terbit: { label: "Terbit", ikon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-brand-50 text-brand-800 border-brand-300" },
  ditarik: { label: "Ditarik", ikon: <XCircle className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-muted text-muted-foreground border-border" },
  belumDibaca: { label: "Belum dibaca", ikon: <Inbox className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-brand-50 text-brand-800 border-brand-300" },
  terkirim: { label: "Terkirim", ikon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-brand-50 text-brand-800 border-brand-300" },
  gagal: { label: "Gagal", ikon: <Wrench className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-cta-50 text-cta-700 border-cta-500" },
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const meta = PETA[status] ?? { label: status, ikon: <CircleAlert className="h-3.5 w-3.5" aria-hidden />, kelas: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.kelas} ${className}`}>
      {meta.ikon}
      {meta.label}
    </span>
  );
}
