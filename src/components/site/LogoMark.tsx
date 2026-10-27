import Image from "next/image";

/**
 * Logo resmi LKSA PAYM Danukusumo (aset: public/images/logo-danukusumo.png).
 * Render dekoratif (alt kosong) karena nama lembaga selalu tampil
 * sebagai teks di samping logo — aman untuk pembaca layar.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo-danukusumo.png"
      alt=""
      width={512}
      height={512}
      aria-hidden
      className={`rounded-full object-contain ${className ?? ""}`}
    />
  );
}
