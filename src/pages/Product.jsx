import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Heart, ShieldCheck, Truck, PackageCheck } from 'lucide-react';
import { useStore, getProductById, getSimilar } from '../lib/store.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { BuyButton } from '../components/BuyButton.jsx';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import { SkeletonGrid } from '../components/Skeletons.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { useWishlist } from '../lib/wishlist.jsx';
import { useToast } from '../lib/toast.jsx';
import { useMeta } from '../hooks/useMeta.js';
import { resolveAsset, formatPrice } from '../lib/utils.js';

const SITE = 'https://shesaidmewakeup.github.io/pegasus-store';

const TRUST = [
  { icon: ShieldCheck, text: 'Только оригинал' },
  { icon: Truck, text: 'Доставка по России' },
  { icon: PackageCheck, text: 'Безопасная сделка на Авито' },
];

export function Product() {
  const { products } = useStore();
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const product = useMemo(
    () => (products ? getProductById(products, id) : undefined),
    [products, id],
  );

  const [activeImage, setActiveImage] = useState(0);
  const { has, toggle } = useWishlist();
  const { push } = useToast();

  const images = useMemo(() => product?.images ?? [], [product]);
  const image = images[activeImage] ?? images[0] ?? '';
  const liked = product ? has(product.id) : false;

  const similar = useMemo(
    () => (products && product ? getSimilar(products, product, 4) : []),
    [products, product],
  );

  useMeta({
    title: product ? `${product.name} — Pegasus Store` : 'Товар — Pegasus Store',
    description: product?.description || 'Каталог Pegasus Store',
    canonical: product ? `${SITE}/#/product?id=${encodeURIComponent(product.id)}` : undefined,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.images?.map((img) => resolveAsset(img)),
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'RUB',
            availability: product.avitoLink ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }
      : undefined,
  });

  if (product === undefined && products !== null) {
    return (
      <div className="container mx-auto max-w-[1280px] px-6">
        <EmptyState
          title="Товар не найден"
          text="Возможно, он был продан или ссылка устарела."
        >
          <Link to="/catalog" className="btn btn-gold">Вернуться в каталог</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1280px] px-6">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Каталог', to: '/catalog' },
          ...(product?.category
            ? [{ label: product.category, to: `/catalog?category=${encodeURIComponent(product.category)}` }]
            : []),
          ...(product ? [{ label: product.name }] : []),
        ]}
      />

      {!product ? (
        <SkeletonGrid count={1} />
      ) : (
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* --- Галерея --- */}
          <div className="grid gap-4 self-start">
            <div className="relative overflow-hidden rounded border border-line bg-white">
              {product.isNew && (
                <span className="absolute top-4 left-4 z-[1] px-3 py-1 bg-gold text-white text-[10px] uppercase tracking-[0.16em]">
                  Новинка
                </span>
              )}
              {image ? (
                <img
                  key={image}
                  src={resolveAsset(image)}
                  alt={product.name}
                  width={900}
                  height={900}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-square w-full object-contain p-8"
                />
              ) : (
                <div className="aspect-square grid w-full place-items-center text-line">
                  <svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                    <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Фото ${i + 1}`}
                    aria-pressed={i === activeImage}
                    className={`overflow-hidden rounded border bg-white transition-[border-color,opacity] duration-150
                                ${i === activeImage ? 'border-gold' : 'border-line opacity-70 hover:opacity-100'}`}
                  >
                    <img
                      src={resolveAsset(img)}
                      alt=""
                      width={200}
                      height={200}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- Информация --- */}
          <div className="grid gap-6 self-start">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold font-medium">
                {product.subcategory || product.category}
              </p>
              <h1 className="mt-2 text-[clamp(1.8rem,1.2rem+2.6vw,3rem)] leading-tight">
                {product.name}
              </h1>
              <p className="mt-4 text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] tabular-nums text-ink">
                {formatPrice(product.price)}
              </p>
            </div>

            {product.description && (
              <p className="text-muted leading-relaxed">{product.description}</p>
            )}

            <div className="grid gap-3">
              <BuyButton product={product} />
              <button
                type="button"
                onClick={() => {
                  const added = toggle(product.id);
                  push(added ? 'Добавлено в избранное' : 'Удалено из избранного');
                }}
                aria-pressed={liked}
                className="btn btn-ghost btn-full"
              >
                <Heart
                  size={16}
                  aria-hidden="true"
                  className={liked ? 'text-danger fill-current' : ''}
                />
                {liked ? 'В избранном' : 'В избранное'}
              </button>
            </div>

            {/* Условия сделки */}
            <div className="rounded border border-line bg-surface p-5">
              <h2 className="mb-3 text-xs font-body font-normal uppercase tracking-[0.2em] text-muted">
                Как проходит покупка
              </h2>
              <ul className="grid gap-2.5 text-sm text-ink-soft">
                {TRUST.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <Icon size={18} className="shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
                    {text}
                  </li>
                ))}
                <li className="flex items-start gap-3 text-muted">
                  <Check size={18} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
                  <span>
                    Нажатие на кнопку «Купить» открывает объявление на Авито —
                    сделка и оплата проходят там.
                  </span>
                </li>
              </ul>
            </div>

            {/* Характеристики */}
            {Object.keys(product.specs ?? {}).length > 0 && (
              <div className="rounded border border-line bg-surface p-5">
                <h2 className="mb-4 text-xs font-body font-normal uppercase tracking-[0.2em] text-muted">
                  Характеристики
                </h2>
                <dl className="grid gap-3">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="specs-row">
                      <dt className="specs-key">{key}</dt>
                      <dd className="specs-val">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Похожие товары --- */}
      {similar.length > 0 && (
        <section className="mt-20" aria-labelledby="similar-title">
          <h2 className="mb-8 text-[clamp(1.5rem,1.2rem+1.6vw,2.25rem)]" id="similar-title">
            Похожие товары
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-6 gap-y-8">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
