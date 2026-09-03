import { ExternalLink } from 'lucide-react';
import { isAvitoAvailable } from '../lib/store.jsx';

/**
 * Кнопка покупки. Если ссылки на Авито нет — показываем честное состояние
 * вместо неработающей ссылки.
 * @param {{ product: import('../lib/store.jsx').Product, className?: string }}
 */
export function BuyButton({ product, className = 'btn-buy btn-full' }) {
  // Товар можно купить, только если он в наличии И есть ссылка на Авито.
  const available = isAvitoAvailable(product) && product.inStock !== false;

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
