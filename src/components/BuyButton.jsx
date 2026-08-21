import { ExternalLink } from 'lucide-react';
import { isAvitoAvailable } from '../lib/store.jsx';

/**
 * Кнопка покупки. Если ссылки на Авито нет — показываем честное состояние
 * вместо неработающей ссылки.
 * @param {{ product: import('../lib/store.jsx').Product, className?: string }}
 */
export function BuyButton({ product, className = 'btn-buy btn-full' }) {
  const available = isAvitoAvailable(product);

  if (available) {
    return (
      <a
        href={product.avitoLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn ${className}`}
        aria-label={`Купить «${product.name}» на Авито (откроется в новой вкладке)`}
      >
        Купить на Авито
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    );
  }

  return (
    <button type="button" className={`btn ${className}`} disabled aria-disabled="true">
      Нет в наличии
    </button>
  );
}
