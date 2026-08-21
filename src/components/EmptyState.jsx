import { Package } from 'lucide-react';

/**
 * @param {{ title: string, text?: string, children?: React.ReactNode, className?: string }}
 */
export function EmptyState({ title, text, children, className = '' }) {
  return (
    <div className={`grid justify-items-center gap-4 py-24 text-center text-muted ${className}`}>
      <Package size={56} className="text-line" aria-hidden="true" />
      <p className="text-xl text-ink">{title}</p>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
