import { Link } from 'react-router-dom';

const BRAND = 'Pegasus Store';

function PegasusMark() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         className="text-gold shrink-0" aria-hidden="true">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
    </svg>
  );
}

/** @param {{ isLink?: boolean }} */
export function Logo({ isLink = true }) {
  const inner = (
    <>
      <PegasusMark />
      <span className="font-display text-[1.35rem] tracking-[0.18em] uppercase whitespace-nowrap">
        {BRAND}
      </span>
    </>
  );

  return isLink ? (
    <Link to="/" aria-label={`${BRAND} — на главную`} className="inline-flex items-center gap-3 shrink-0">
      {inner}
    </Link>
  ) : (
    <div className="inline-flex items-center gap-3 shrink-0">{inner}</div>
  );
}
