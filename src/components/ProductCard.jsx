import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Reveal } from './Reveal.jsx';
import { BuyButton } from './BuyButton.jsx';
import { useWishlist } from '../lib/wishlist.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatPrice, resolveAsset } from '../lib/utils.js';

/**
 * Карточка товара для сеток каталога, главной, поиска и избранного.
 * @param {{ product: import('../lib/store.jsx').Product, eager?: boolean }}
 */
export function ProductCard({ product, eager = false }) {
  const { has, toggle } = useWishlist();
  const { push } = useToast();
  const liked = has(product.id);
  const href = `/product?id=${encodeURIComponent(product.id)}`;
  const [main, alt] = product.images;
  const hasAlt = Boolean(alt);

  const onFav = (event) => {
    event.preventDefault();
    const added = toggle(product.id);
    push(added ? 'Добавлено в избранное' : 'Удалено из избранного');
  };

  const soldOut = product.inStock === false;
  const badge = soldOut
    ? <span className="absolute top-3 left-3 z-[2] px-3 py-1 bg-muted text-white text-[10px] uppercase tracking-[0.16em]">Продано</span>
    : product.isNew
      ? <span className="absolute top-3 left-3 z-[2] px-3 py-1 bg-gold text-white text-[10px] uppercase tracking-[0.16em]">Новинка</span>
      : product.isBestseller
        ? <span className="absolute top-3 left-3 z-[2] px-3 py-1 bg-ink text-white text-[10px] uppercase tracking-[0.16em]">Хит</span>
        : null;

  return (
    <Reveal as="article" className="card group">
      {badge}

      <button
        type="button"
        onClick={onFav}
        aria-pressed={liked}
        aria-label={`${liked ? 'Убрать из избранного' : 'В избранное'}: ${product.name}`}
        className="absolute top-2 right-2 z-[2] w-11 h-11 grid place-items-center rounded-full
                   bg-white/80 backdrop-blur text-muted transition-[color,transform,background] duration-150
                   hover:text-danger hover:scale-110"
      >
        <Heart size={20} className={liked ? 'text-danger fill-current' : ''} aria-hidden="true" />
      </button>

      <Link
        to={href}
        tabIndex={-1}
        aria-hidden="true"
        className={`block aspect-square overflow-hidden bg-white ${soldOut ? 'opacity-60' : ''}`}
      >
        {main ? (
          <>
            <img
              src={resolveAsset(main)}
              alt=""
              width={600}
              height={600}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className={`h-full w-full object-contain p-6 transition-[transform,opacity] duration-500 group-hover:scale-105 ${hasAlt ? 'group-hover:opacity-0' : ''}`}
            />
            {hasAlt && (
              <img
                src={resolveAsset(alt)}
                alt=""
                width={600}
                height={600}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-contain p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center text-line">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {product.subcategory || product.category}
        </p>
        <h3 className="min-h-[2.8em] font-body text-base font-normal leading-snug">
          <Link to={href} className="transition-colors duration-150 hover:text-gold">
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto pt-3 text-lg tabular-nums">{formatPrice(product.price)}</p>
        <BuyButton product={product} />
      </div>
    </Reveal>
  );
}
