import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.jsx';
import { SkeletonGrid } from '../components/Skeletons.jsx';
import { StoreError } from '../components/StoreError.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import { useStore, getCategories, getCategoryCounts, isAvitoAvailable } from '../lib/store.jsx';
import { useMeta } from '../hooks/useMeta.js';
import { pluralGoods, normalizeId } from '../lib/utils.js';

const SORTS = [
  { value: 'default', label: 'Сначала популярные' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'new', label: 'Новинки' },
];

/** Ключ фильтра-характеристики в URL: spec_ + encodeURIComponent(имя) */
function specParamKey(name) {
  return `spec_${encodeURIComponent(name)}`;
}

function decodeSpecParam(key) {
  return key.startsWith('spec_') ? decodeURIComponent(key.slice(5)) : null;
}

/** Собирает Map<имя характеристики, Set<значения>> из параметров URL. */
function readSpecFilters(params) {
  const filters = new Map();
  params.forEach((value, key) => {
    const name = decodeSpecParam(key);
    if (!name) return;
    const values = value.split(',').map((v) => v.trim()).filter(Boolean);
    if (values.length > 0) filters.set(name, new Set(values));
  });
  return filters;
}

/** Доступные значения характеристики с количеством товаров. */
function specFacet(products, name) {
  const counts = new Map();
  products.forEach((p) => {
    const value = p.specs?.[name];
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function Catalog() {
  const { products, error } = useStore();
  const [params, setParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'default';

  const specFilters = useMemo(() => readSpecFilters(params), [params]);

  useMeta({
    title: category
      ? `${category} — каталог Pegasus Store`
      : 'Каталог — Pegasus Store',
    description: 'Чехлы, защитные стёкла, зарядные устройства и техника. Оригинальные аксессуары с покупкой через безопасную сделку Авито.',
  });

  const categories = useMemo(
    () => (products ? getCategories(products) : []),
    [products],
  );
  const categoryCounts = useMemo(
    () => (products ? getCategoryCounts(products) : new Map()),
    [products],
  );

  /** Товары активной категории — база для фасетов характеристик. */
  const categoryProducts = useMemo(() => {
    if (!products) return null;
    return category ? products.filter((p) => p.category === category) : products;
  }, [products, category]);

  /** Имена характеристик — только из товаров активной категории.
   *  Без выбранной категории характеристик не показываем вовсе. */
  const facetNames = useMemo(() => {
    if (!products || !category) return [];
    const names = new Set();
    categoryProducts.forEach((p) => Object.keys(p.specs ?? {}).forEach((k) => names.add(k)));
    return [...names];
  }, [products, category, categoryProducts]);

  const filtered = useMemo(() => {
    if (!products) return null;
    let list = products;

    if (category) list = list.filter((p) => p.category === category);

    if (specFilters.size > 0) {
      list = list.filter((p) => {
        for (const [name, values] of specFilters) {
          if (!values.has(String(p.specs?.[name] ?? ''))) return false;
        }
        return true;
      });
    }

    /** Распроданные и товары без ссылки на Авито — всегда в конце,
     *  внутри групп — выбранная сортировка. Логика повторяет BuyButton. */
    const soldOutRank = (p) => (isAvitoAvailable(p) && p.inStock !== false ? 0 : 1);

    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => soldOutRank(a) - soldOutRank(b) || a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => soldOutRank(a) - soldOutRank(b) || b.price - a.price);
        break;
      case 'new':
        list = [...list].sort((a, b) => soldOutRank(a) - soldOutRank(b) || Number(b.isNew) - Number(a.isNew));
        break;
      default:
        list = [...list].sort((a, b) => soldOutRank(a) - soldOutRank(b));
        break;
    }
    return list;
  }, [products, category, specFilters, sort]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (category) chips.push({ key: 'category', label: category });
    specFilters.forEach((values, name) => {
      values.forEach((v) => chips.push({ key: `${name}::${v}`, name, value: v, label: v }));
    });
    return chips;
  }, [category, specFilters]);

  const removeChip = (chip) => {
    const next = new URLSearchParams(params);
    if (chip.key === 'category') {
      next.delete('category');
    } else {
      const key = specParamKey(chip.name);
      const remaining = [...(specFilters.get(chip.name) ?? [])].filter(
        (v) => v !== chip.value,
      );
      if (remaining.length > 0) next.set(key, remaining.join(','));
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const setCategory = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('category', value);
    else next.delete('category');
    setParams(next, { replace: true });
  };

  const toggleSpec = (name, value) => {
    const key = specParamKey(name);
    const current = specFilters.get(name) ?? new Set();
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);

    const url = new URLSearchParams(params);
    if (next.size > 0) url.set(key, [...next].join(','));
    else url.delete(key);
    setParams(url, { replace: true });
  };

  const setSort = (value) => {
    const next = new URLSearchParams(params);
    if (value === 'default') next.delete('sort');
    else next.set('sort', value);
    setParams(next, { replace: true });
  };

  /** Сайдбар с фильтрами — используется и в десктопной колонке, и в мобильном оверлее. */
  const filtersSidebar = (
    <div className="grid gap-8">
      <fieldset>
        <legend className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Категория</legend>
        <div className="grid gap-1">
          <button
            type="button"
            className="filter-btn"
            aria-pressed={!category}
            onClick={() => setCategory('')}
          >
            <span>Все товары</span>
            <span className="filter-btn__count">{products?.length ?? ''}</span>
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              className="filter-btn"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
            >
              <span>{name}</span>
              <span className="filter-btn__count">{categoryCounts.get(name) ?? 0}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {category ? (
        facetNames.length > 0 ? (
          <div className="grid">
            {facetNames.map((name) => {
              const facets = specFacet(categoryProducts ?? [], name);
              if (facets.length === 0) return null;
              const selected = specFilters.get(name) ?? new Set();
              return (
                <details key={name} className="group border-b border-line py-1">
                  <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-2 py-2 text-xs uppercase tracking-[0.16em] text-muted transition-colors duration-150 hover:text-gold [&::-webkit-details-marker]:hidden">
                    {name}
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-muted transition-transform duration-200 group-[[open]]:rotate-180"
                    />
                  </summary>
                  <div className="grid gap-1 pb-2 pt-1">
                    {facets.map(([value, count]) => (
                      <label key={value} className="filter-check">
                        <input
                          type="checkbox"
                          checked={selected.has(value)}
                          onChange={() => toggleSpec(name, value)}
                        />
                        <span className="flex-1">{value}</span>
                        <span className="filter-btn__count">{count}</span>
                      </label>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted">В этой категории нет характеристик для фильтрации.</p>
        )
      ) : (
        <p className="text-xs text-muted">
          Выберите категорию — появятся фильтры по характеристикам.
        </p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto max-w-[1280px] px-6">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Каталог' },
        ]}
      />

      <header className="mb-8 grid gap-3 md:flex md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-medium">
            {category || 'Весь каталог'}
          </p>
          <h1 className="text-[clamp(2rem,1.4rem+2.8vw,3.5rem)]">
            {category || 'Каталог'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {filtered ? `${filtered.length} ${pluralGoods(filtered.length)}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="btn btn-ghost md:hidden"
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Фильтры
          </button>

          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">Сортировка:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-gold"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {/* Активные фильтры */}
      {activeChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <span key={chip.key} className="chip">
              {chip.label}
              <button
                type="button"
                onClick={() => removeChip(chip)}
                aria-label={`Убрать фильтр «${chip.label}»`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-muted underline decoration-dotted underline-offset-4 transition-colors duration-150 hover:text-gold"
          >
            Сбросить всё
          </button>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* Сайдбар: десктоп */}
        <aside className="hidden lg:block" aria-label="Фильтры каталога">
          <div className="sticky top-24">
            {filtersSidebar}
          </div>
        </aside>

        {/* Сетка товаров */}
        <div>
          {error ? (
            <StoreError error={error} />
          ) : filtered === null ? (
            <SkeletonGrid count={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              text="Попробуйте убрать часть фильтров или выбрать другую категорию."
            >
              <Link to="/catalog" className="btn btn-gold">Сбросить фильтры</Link>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-6 gap-y-8">
              {filtered.map((product) => (
                <ProductCard key={normalizeId(product.id)} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Мобильные фильтры — оверлей с тем же содержимым */}
      <MobileFilters
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      >
        {filtersSidebar}
      </MobileFilters>
    </div>
  );
}

function MobileFilters({ open, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-cream/97 backdrop-blur transition-[opacity,visibility] duration-300 lg:hidden"
      data-open={String(open)}
      style={{ opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden' }}
      role="dialog"
      aria-modal="true"
      aria-label="Фильтры каталога"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg">Фильтры</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть фильтры"
            className="w-11 h-11 grid place-items-center rounded-full transition-colors duration-150 hover:bg-gold-soft"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
        <div className="border-t border-line px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-primary btn-full">
            Показать товары
          </button>
        </div>
      </div>
    </div>
  );
}
