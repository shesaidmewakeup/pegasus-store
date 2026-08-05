/**
 * Загрузка и нормализация каталога товаров.
 * @module store
 */

import { normalizeId, parsePrice, slugify } from './utils.js';

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
 * @property {string} description
 * @property {string} slug
 */

/** @type {Product[]} */
let products = [];
let loaded = false;

/**
 * Приводит запись из products.json к предсказуемой форме.
 * Все опциональные поля получают значения по умолчанию, чтобы UI
 * не приходилось защищаться проверками на каждом обращении.
 * @param {Record<string, any>} raw
 * @param {number} index
 * @returns {Product}
 */
function normalize(raw, index) {
  const images = Array.isArray(raw.images) ? raw.images.filter(Boolean) : [];
  const specs = raw.specs && typeof raw.specs === 'object' ? raw.specs : {};
  const filters = raw.filters && typeof raw.filters === 'object' ? raw.filters : {};

  return {
    id: normalizeId(raw.id ?? index),
    name: String(raw.name ?? 'Без названия'),
    price: parsePrice(raw.price),
    category: String(raw.category ?? 'Разное'),
    subcategory: String(raw.subcategory ?? ''),
    images,
    specs,
    filters,
    avitoLink: typeof raw.avitoLink === 'string' ? raw.avitoLink.trim() : '',
    isNew: Boolean(raw.isNew),
    isBestseller: Boolean(raw.isBestseller),
    description: String(raw.description ?? ''),
    slug: slugify(raw.name ?? ''),
  };
}

/**
 * Загружает каталог (единожды за сессию страницы).
 * @returns {Promise<Product[]>}
 */
export async function loadProducts() {
  if (loaded) return products;

  const response = await fetch('products.json', { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Не удалось загрузить каталог: HTTP ${response.status}`);
  }

  const raw = await response.json();
  if (!Array.isArray(raw)) {
    throw new Error('Каталог повреждён: ожидался массив товаров');
  }

  products = raw.map(normalize);
  loaded = true;
  return products;
}

/** @returns {Product[]} */
export function getProducts() {
  return products;
}

/**
 * @param {string|number} id
 * @returns {Product|undefined}
 */
export function getProductById(id) {
  const target = normalizeId(id);
  return products.find((p) => p.id === target);
}

/**
 * Товары для главной. Если ни один товар не помечен как бестселлер,
 * берём первые доступные — секция никогда не остаётся пустой
 * (в исходной версии главная показывала пустой блок «Бестселлеры»).
 * @param {number} [limit=4]
 * @returns {Product[]}
 */
export function getFeatured(limit = 4) {
  const flagged = products.filter((p) => p.isBestseller);
  const source = flagged.length > 0 ? flagged : products;
  return source.slice(0, limit);
}

/**
 * Похожие товары: сначала та же категория, при нехватке — дополняем остальными.
 * @param {Product} product
 * @param {number} [limit=4]
 * @returns {Product[]}
 */
export function getSimilar(product, limit = 4) {
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const others = products.filter(
    (p) => p.id !== product.id && p.category !== product.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/** @returns {string[]} */
export function getCategories() {
  return [...new Set(products.map((p) => p.category))].filter(Boolean).sort();
}

/**
 * Считает количество товаров в каждой категории.
 * @returns {Map<string, number>}
 */
export function getCategoryCounts() {
  const counts = new Map();
  products.forEach((p) => {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  });
  return counts;
}
