import { useEffect, useMemo, useRef, useState } from 'react';
import { useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { X, Search } from 'lucide-react';
import { Overlay } from './Overlay.jsx';
import { ProductCard } from './ProductCard.jsx';
import { SkeletonGrid } from './Skeletons.jsx';
import { useStore } from '../lib/store.jsx';
import { highlightHtml } from '../lib/utils.js';

function useSearchResults(query) {
  const { products } = useStore();
  const deferred = useDeferredValue(query);

  return useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q || !products) return { products: [], q: '' };

    const found = products.filter((p) => (
      p.name.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || p.subcategory.toLowerCase().includes(q)
      || Object.values(p.specs).some((v) => String(v).toLowerCase().includes(q))
    ));
    return { products: found.slice(0, 12), q: deferred.trim() };
  }, [products, deferred]);
}

/** @param {{ open: boolean, onClose: () => void }} */
export function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const { products } = useStore();
  const { products: results, q } = useSearchResults(query);

  // При каждом открытии — пустое поле и фокус
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  return (
    <Overlay open={open} onClose={onClose} label="Поиск по каталогу" autoFocus="[data-search-input]" className="overflow-y-auto">
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть поиск"
        className="absolute top-4 right-4 w-12 h-12 grid place-items-center rounded-full transition-colors duration-150 hover:bg-gold-soft"
      >
        <X size={22} aria-hidden="true" />
      </button>

      <div className="max-w-[1280px] mx-auto px-6 pt-[clamp(4rem,12vh,140px)] pb-16">
        <div className="relative border-b border-ink">
          <Search size={24} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            data-search-input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Что ищете?"
            autoComplete="off"
            spellCheck="false"
            aria-label="Поиск товаров"
            className="w-full bg-transparent border-none font-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] py-4 pl-10 focus:outline-none placeholder:text-[#c3bdb4]"
          />
        </div>
        <p className="mt-3 text-sm text-muted">Начните вводить название, бренд или категорию</p>

        {q && (
          <div className="mt-12">
            {products === null ? (
              <SkeletonGrid count={4} />
            ) : results.length === 0 ? (
              <p className="py-16 text-center text-muted">
                По запросу «{q}» ничего не найдено
              </p>
            ) : (
              <div
                className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-6 gap-y-8"
                role="region"
                aria-live="polite"
              >
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            {/* Подсветка совпадений в заголовках */}
            <style>{`
              .search-mark { background: var(--color-gold-soft); padding-inline: 2px; }
            `}</style>
          </div>
        )}
      </div>

      {/* Подсветка выполняется поверх заголовков карточек */}
      <HighlightTitles products={results} query={q} />
    </Overlay>
  );
}

/** После отрисовки карточек подсвечивает вхождения запроса в заголовках. */
function HighlightTitles({ products, query }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!query || products.length === 0) return;
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll('.card h3 a').forEach((link, i) => {
      const product = products[i];
      if (!product) return;
      link.innerHTML = highlightHtml(product.name, query).replace(/<mark>/g, '<mark class="search-mark">');
    });
  }, [products, query]);

  return <div ref={ref} hidden aria-hidden="true" />;
}
