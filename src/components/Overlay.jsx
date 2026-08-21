import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap.js';

/**
 * Модальный оверлей: блокировка прокрутки, ловушка фокуса, закрытие по Escape.
 * Остаётся в DOM, видимость переключается CSS-классом (для плавной анимации).
 * @param {{ open: boolean, onClose: () => void, label: string, autoFocus?: string, children: React.ReactNode, className?: string }}
 */
export function Overlay({ open, onClose, label, autoFocus, children, className = '' }) {
  const ref = useRef(null);
  useFocusTrap(ref, open);

  // Блокировка прокрутки страницы
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  // Фокус на целевом элементе после открытия
  useEffect(() => {
    if (!open || !autoFocus) return undefined;
    const timer = setTimeout(() => {
      ref.current?.querySelector(autoFocus)?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [open, autoFocus]);

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className={`overlay ${className}`}
      data-open={String(open)}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      inert={!open}
    >
      {children}
    </div>
  );
}
