import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useWishlist } from '../lib/wishlist.jsx';
import { useStore } from '../lib/store.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import { useMeta } from '../hooks/useMeta.js';
import { pluralGoods } from '../lib/utils.js';

export function Wishlist() {
  const { products } = useStore();
  const { ids, clear } = useWishlist();

  useMeta({
    title: 'Избранное — Pegasus Store',
    description: 'Сохранённые товары Pegasus Store.',
  });

  const liked = products?.filter((p) => ids.has(p.id)) ?? [];

  return (
    <div className="container mx-auto max-w-[1280px] px-6">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Избранное' },
        ]}
      />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-medium">Сохранённое</p>
          <h1 className="text-[clamp(2rem,1.4rem+2.8vw,3.5rem)]">Избранное</h1>
          <p className="mt-2 text-sm text-muted">
            {products ? `${liked.length} ${pluralGoods(liked.length)}` : ''}
          </p>
        </div>

        {liked.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors duration-150 hover:text-danger"
          >
            <Trash2 size={16} aria-hidden="true" />
            Очистить
          </button>
        )}
      </header>

      {products === null ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-6 gap-y-8">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded" />
          ))}
        </div>
      ) : liked.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          text="Отмечайте товары сердечком, чтобы собрать список желаний."
        >
          <Link to="/catalog" className="btn btn-gold">Перейти в каталог</Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-6 gap-y-8">
          {liked.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
