/** Tanda lembaga sederhana (SVG inline) — bukan logo resmi, placeholder sampai aset sah. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Tanda lembaga Danukusumo (placeholder)"
      className={className}
      focusable="false"
    >
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#2C7A64" />
      <path
        d="M20 9 L31 19 H27 V29 H22 V23 H18 V29 H13 V19 H9 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
