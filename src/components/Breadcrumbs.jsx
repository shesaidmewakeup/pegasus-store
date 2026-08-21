import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** @param {{ items: Array<{ label: string, to?: string }> }} */
export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 py-6 text-sm text-muted">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {item.to ? (
            <Link to={item.to} className="transition-colors duration-150 hover:text-gold">{item.label}</Link>
          ) : (
            <span aria-current="page" className="text-ink">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight size={12} className="opacity-50" aria-hidden="true" />}
        </span>
      ))}
    </nav>
  );
}
