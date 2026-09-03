/**
 * Каталог товаров: загрузка из Supabase (таблица products), нормализация
 * и селекторы. Данные редактируются менеджером (manager.py) напрямую в БД —
 * новый товар появляется на витрине после обычного обновления страницы,
 * пересборка не нужна.
 *
 * Переменные окружения для подключения — в .env (шаблон .env.example),
 * клиент — в lib/supabase.js.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeId, parsePrice, slugify } from './utils.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {string} category
 * @property {string} subcategory
 * @property {string[]} images
 * @property {Record<string,string>} specs
 * @property {Record<string,string>} filters
 * @property {string} avitoLink
 * @property {boolean} isNew
 * @property {boolean} isBestseller
 * @property {boolean} inStock
 * @property {string} description
 * @property {string} slug
 */

/**
 * Приводит запись из БД Supabase (snake_case) к предсказуемой форме.
 * @param {Record<string, any>} raw
 * @param {number} index
 * @returns {Product}
 */
function normalize(raw, index) {
  const images = Array.isArray(raw.images) ? raw.images.filter(Boolean) : [];
  const specs = raw.specs && typeof raw.specs === 'object' ? raw.specs : {};
  const filters = raw.filters && typeof raw.filters === 'object' ? raw.filters : {};

  const avitoLink = raw.avito_link ?? raw.avitoLink;
  const isNew = raw.is_new ?? raw.isNew;
  const isBestseller = raw.is_bestseller ?? raw.isBestseller;
  // По умолчанию товар в наличии (колонки может не быть у старых записей).
  const inStock = raw.in_stock ?? raw.inStock;

  return {
    id: normalizeId(raw.id ?? index),
    name: String(raw.name ?? 'Без названия'),
    price: parsePrice(raw.price),
    category: String(raw.category ?? 'Разное'),
    subcategory: String(raw.subcategory ?? ''),
    images,
    specs,
    filters,
    avitoLink: typeof avitoLink === 'string' ? avitoLink.trim() : '',
    isNew: Boolean(isNew),
    isBestseller: Boolean(isBestseller),
    inStock: inStock !== false,
    description: String(raw.description ?? ''),
    slug: slugify(raw.name ?? ''),
  };
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  /** @type {[Product[] | null, Function]} null — идёт загрузка */
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isSupabaseConfigured) {
          throw new Error(
            'Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файл .env (шаблон — .env.example).',
          );
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true });

        if (error) throw error;
        if (!cancelled) setProducts((data ?? []).map(normalize));
      } catch (e) {
        if (!cancelled) setError(e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({ products, error }), [products, error]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** @returns {{ products: Product[] | null, error: Error | null }} */
export function useStore() {
  return useContext(StoreContext);
}

/* --- Селекторы (чистые функции, мемоизируются в компонентах) --------------- */

/** @param {Product[]} products */
export function getProductById(products, id) {
  const target = normalizeId(id);
  return products.find((p) => p.id === target);
}

/**
 * Товары для главной: сначала помеченные бестселлерами, при нехватке —
 * любые первые. Секция никогда не остаётся пустой.
 * @param {Product[]} products
 * @param {number} [limit=4]
 */
export function getFeatured(products, limit = 4) {
  const flagged = products.filter((p) => p.isBestseller);
  const source = flagged.length > 0 ? flagged : products;
  return source.slice(0, limit);
}

/**
 * Похожие товары: сначала та же категория, при нехватке — дополняем остальными.
 * @param {Product[]} products
 * @param {Product} product
 * @param {number} [limit=4]
 */
export function getSimilar(products, product, limit = 4) {
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const others = products.filter(
    (p) => p.id !== product.id && p.category !== product.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/** @param {Product[]} products @returns {string[]} */
export function getCategories(products) {
  return [...new Set(products.map((p) => p.category))].filter(Boolean).sort();
}

/** @param {Product[]} products @returns {Map<string, number>} */
export function getCategoryCounts(products) {
  const counts = new Map();
  products.forEach((p) => {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  });
  return counts;
}

/** @param {Product[]} products */
export function isAvitoAvailable(product) {
  return /^https?:\/\//i.test(product.avitoLink);
}
