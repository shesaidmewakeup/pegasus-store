/**
 * Точка входа: инициализация страниц.
 * @module app
 */

import { debounce, escapeHtml, formatPrice, highlight, parsePrice } from './utils.js';
import { icon } from './icons.js';
import * as store from './store.js';
import * as wishlist from './wishlist.js';
import {
  NAV_CATEGORIES, bindFavButtons, bindFavCounter, createOverlay, observeReveal,
  productCard, renderFooter, renderHeader, skeletonCards,
} from './ui.js';

const PAGE_SIZE = 9;

/* ==========================================================================
   Общее
   ========================================================================== */

function initChrome() {
  // Флаг для CSS: анимации появления включаются только при живом JS,
  // иначе контент должен быть виден сразу.
  document.documentElement.dataset.js = 'true';

  const active = document.body.dataset.page === 'catalog'
    ? (new URLSearchParams(location.search).get('category') || 'catalog')
    : '';

  renderHeader({ active });
  renderFooter();
  bindFavCounter();
  bindFavButtons();

  // Тень у шапки при прокрутке
  const header = document.querySelector('[data-header-root]');
  if (header) {
    const onScroll = () => {
      header.dataset.scrolled = String(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  initMobileMenu();
  initSearch();
}

function initMobileMenu() {
  const menu = document.querySelector('[data-menu]');
  const openBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  if (!menu || !openBtn || !closeBtn) return;

  const overlay = createOverlay(menu);
  openBtn.addEventListener('click', () => {
    overlay.open();
    openBtn.setAttribute('aria-expanded', 'true');
  });
  closeBtn.addEventListener('click', () => {
    overlay.close();
    openBtn.setAttribute('aria-expanded', 'false');
  });
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => overlay.close());
  });
}

function initSearch() {
  const modal = document.querySelector('[data-search]');
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');
  const closeBtn = document.querySelector('[data-search-close]');
  if (!modal || !input || !results) return;

  const overlay = createOverlay(modal);

  document.querySelectorAll('[data-search-open]').forEach((btn) => {
    btn.addEventListener('click', () => overlay.open());
  });
  closeBtn?.addEventListener('click', () => overlay.close());

  // Ctrl/Cmd+K — быстрый вызов поиска
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      overlay.isOpen() ? overlay.close() : overlay.open();
    }
  });

  const run = debounce((query) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      results.innerHTML = '';
      return;
    }

    const found = store.getProducts().filter((p) => (
      p.name.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || p.subcategory.toLowerCase().includes(q)
      || Object.values(p.specs).some((v) => String(v).toLowerCase().includes(q))
    ));

    if (found.length === 0) {
      results.innerHTML = `<p class="search__empty">По запросу «${escapeHtml(query)}» ничего не найдено</p>`;
      return;
    }

    results.innerHTML = found.slice(0, 12).map((p) => productCard(p)).join('');
    // Подсветка совпадений в заголовках
    results.querySelectorAll('.card__title a').forEach((link, i) => {
      link.innerHTML = highlight(found[i].name, query);
    });
    observeReveal(results);
  }, 180);

  input.addEventListener('input', (event) => run(event.target.value));
}

/**
 * Единый экран ошибки загрузки каталога.
 * @param {unknown} error
 */
function showLoadError(error) {
  console.error('Каталог не загрузился:', error);
  document.querySelectorAll('[data-grid], [data-product-root]').forEach((host) => {
    host.innerHTML = `
      <div class="empty-state">
        ${icon('box', { size: 56 })}
        <p class="empty-state__title">Не удалось загрузить каталог</p>
        <p>Проверьте соединение и обновите страницу.</p>
        <button type="button" class="btn btn--ghost" onclick="location.reload()">Обновить</button>
      </div>`;
  });
}

/* ==========================================================================
   Главная
   ========================================================================== */

function initHome() {
  const grid = document.querySelector('[data-featured]');
  if (!grid) return;

  grid.innerHTML = skeletonCards(4);
  const featured = store.getFeatured(4);
  grid.innerHTML = featured.map((p, i) => productCard(p, { eager: i < 2 })).join('');
  observeReveal(grid);
}

/* ==========================================================================
   Каталог
   ========================================================================== */

const catalogState = {
  category: null,
  subcategory: null,
  /** @type {Record<string, string[]>} */
  filters: {},
  sort: 'default',
  shown: PAGE_SIZE,
};

function readStateFromUrl() {
  const params = new URLSearchParams(location.search);
  catalogState.category = params.get('category');
  catalogState.subcategory = params.get('sub');
  catalogState.sort = params.get('sort') || 'default';
  catalogState.filters = {};

  params.forEach((value, key) => {
    if (!key.startsWith('f_')) return;
    catalogState.filters[key.slice(2)] = value.split('|').filter(Boolean);
  });
}

/** Синхронизирует состояние фильтров с адресной строкой — ссылкой можно делиться. */
function writeStateToUrl() {
  const params = new URLSearchParams();
  if (catalogState.category) params.set('category', catalogState.category);
  if (catalogState.subcategory) params.set('sub', catalogState.subcategory);
  if (catalogState.sort !== 'default') params.set('sort', catalogState.sort);
  Object.entries(catalogState.filters).forEach(([key, values]) => {
    if (values.length) params.set(`f_${key}`, values.join('|'));
  });

  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

/** @returns {import('./store.js').Product[]} */
function selectProducts() {
  let list = store.getProducts();

  if (catalogState.category) list = list.filter((p) => p.category === catalogState.category);
  if (catalogState.subcategory) list = list.filter((p) => p.subcategory === catalogState.subcategory);

  Object.entries(catalogState.filters).forEach(([key, values]) => {
    if (values.length) list = list.filter((p) => values.includes(p.filters?.[key]));
  });

  const sorted = [...list];
  if (catalogState.sort === 'cheap') sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  else if (catalogState.sort === 'expensive') sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  else if (catalogState.sort === 'new') sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));

  return sorted;
}

function renderSidebar() {
  const host = document.querySelector('[data-sidebar]');
  if (!host) return;

  const counts = store.getCategoryCounts();
  const categories = store.getCategories();

  let html = `
    <div class="filter-group">
      <h2 class="filter-group__title">Категории</h2>
      <div class="filter-list">
        <button type="button" class="filter-btn" data-category=""
                aria-pressed="${!catalogState.category}">
          <span>Все товары</span>
          <span class="filter-btn__count">${store.getProducts().length}</span>
        </button>
        ${categories.map((cat) => `
          <button type="button" class="filter-btn" data-category="${escapeHtml(cat)}"
                  aria-pressed="${catalogState.category === cat}">
            <span>${escapeHtml(cat)}</span>
            <span class="filter-btn__count">${counts.get(cat) ?? 0}</span>
          </button>`).join('')}
      </div>
    </div>`;

  // Подкатегории — только внутри выбранной категории
  if (catalogState.category) {
    const subs = [...new Set(
      store.getProducts()
        .filter((p) => p.category === catalogState.category)
        .map((p) => p.subcategory),
    )].filter(Boolean).sort();

    if (subs.length > 0) {
      html += `
        <div class="filter-group">
          <h2 class="filter-group__title">Модель</h2>
          <div class="filter-list">
            ${subs.map((sub) => `
              <button type="button" class="filter-btn" data-sub="${escapeHtml(sub)}"
                      aria-pressed="${catalogState.subcategory === sub}">
                <span>${escapeHtml(sub)}</span>
              </button>`).join('')}
          </div>
        </div>`;
    }
  }

  // Характеристики доступные в текущей выборке
  let scope = store.getProducts();
  if (catalogState.category) scope = scope.filter((p) => p.category === catalogState.category);
  if (catalogState.subcategory) scope = scope.filter((p) => p.subcategory === catalogState.subcategory);

  /** @type {Record<string, Set<string>>} */
  const facets = {};
  scope.forEach((p) => {
    Object.entries(p.filters ?? {}).forEach(([key, value]) => {
      (facets[key] ??= new Set()).add(value);
    });
  });

  Object.entries(facets).forEach(([key, values]) => {
    const selected = catalogState.filters[key] ?? [];
    html += `
      <div class="filter-group">
        <h2 class="filter-group__title">${escapeHtml(key)}</h2>
        <div class="filter-list">
          ${[...values].sort().map((value) => `
            <label class="filter-check">
              <input type="checkbox" data-facet="${escapeHtml(key)}" value="${escapeHtml(value)}"
                     ${selected.includes(value) ? 'checked' : ''}>
              <span>${escapeHtml(value)}</span>
            </label>`).join('')}
        </div>
      </div>`;
  });

  const hasFilters = catalogState.category || catalogState.subcategory
    || Object.keys(catalogState.filters).length > 0;
  if (hasFilters) {
    html += '<button type="button" class="filter-reset" data-reset>Сбросить фильтры</button>';
  }

  host.innerHTML = html;
}

function renderChips() {
  const host = document.querySelector('[data-chips]');
  if (!host) return;

  /** @type {Array<{label: string, kind: string, key?: string, value?: string}>} */
  const chips = [];
  if (catalogState.category) chips.push({ label: catalogState.category, kind: 'category' });
  if (catalogState.subcategory) chips.push({ label: catalogState.subcategory, kind: 'sub' });
  Object.entries(catalogState.filters).forEach(([key, values]) => {
    values.forEach((value) => chips.push({ label: `${key}: ${value}`, kind: 'facet', key, value }));
  });

  host.innerHTML = chips.map((chip) => `
    <span class="chip">
      ${escapeHtml(chip.label)}
      <button type="button" data-chip="${chip.kind}"
              ${chip.key ? `data-key="${escapeHtml(chip.key)}" data-value="${escapeHtml(chip.value)}"` : ''}
              aria-label="Убрать фильтр ${escapeHtml(chip.label)}">
        ${icon('close', { size: 12 })}
      </button>
    </span>`).join('');
}

function renderCatalog() {
  const grid = document.querySelector('[data-grid]');
  const countEl = document.querySelector('[data-count]');
  const moreWrap = document.querySelector('[data-more]');
  if (!grid) return;

  const list = selectProducts();
  const visible = list.slice(0, catalogState.shown);

  if (countEl) {
    const n = list.length;
    const word = n % 10 === 1 && n % 100 !== 11 ? 'товар'
      : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'товара' : 'товаров';
    countEl.textContent = `${n} ${word}`;
  }

  if (visible.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        ${icon('box', { size: 56 })}
        <p class="empty-state__title">Ничего не найдено</p>
        <p>Попробуйте изменить фильтры или сбросить их.</p>
        <button type="button" class="btn btn--ghost" data-reset>Сбросить фильтры</button>
      </div>`;
  } else {
    grid.innerHTML = visible.map((p, i) => productCard(p, { eager: i < 3 })).join('');
  }

  if (moreWrap) moreWrap.hidden = catalogState.shown >= list.length;
  observeReveal(grid);
}

function updateCatalog({ resetPage = true } = {}) {
  if (resetPage) catalogState.shown = PAGE_SIZE;
  writeStateToUrl();
  renderSidebar();
  renderChips();
  renderCatalog();
}

function initCatalog() {
  const root = document.querySelector('[data-catalog]');
  if (!root) return;

  readStateFromUrl();

  const sortSelect = document.querySelector('[data-sort]');
  if (sortSelect) {
    sortSelect.value = catalogState.sort;
    sortSelect.addEventListener('change', () => {
      catalogState.sort = sortSelect.value;
      updateCatalog();
    });
  }

  document.querySelector('[data-more-btn]')?.addEventListener('click', () => {
    catalogState.shown += PAGE_SIZE;
    updateCatalog({ resetPage: false });
  });

  // Делегирование: сайдбар, чипы, сброс
  root.addEventListener('click', (event) => {
    const categoryBtn = event.target.closest('[data-category]');
    const subBtn = event.target.closest('[data-sub]');
    const chipBtn = event.target.closest('[data-chip]');
    const resetBtn = event.target.closest('[data-reset]');

    if (categoryBtn) {
      const value = categoryBtn.dataset.category;
      catalogState.category = value || null;
      catalogState.subcategory = null;
      catalogState.filters = {};
      updateCatalog();
    } else if (subBtn) {
      const value = subBtn.dataset.sub;
      catalogState.subcategory = catalogState.subcategory === value ? null : value;
      updateCatalog();
    } else if (chipBtn) {
      const { chip, key, value } = chipBtn.dataset;
      if (chip === 'category') { catalogState.category = null; catalogState.subcategory = null; catalogState.filters = {}; }
      else if (chip === 'sub') catalogState.subcategory = null;
      else if (chip === 'facet' && key) {
        catalogState.filters[key] = (catalogState.filters[key] ?? []).filter((v) => v !== value);
        if (catalogState.filters[key].length === 0) delete catalogState.filters[key];
      }
      updateCatalog();
    } else if (resetBtn) {
      catalogState.category = null;
      catalogState.subcategory = null;
      catalogState.filters = {};
      updateCatalog();
    }
  });

  root.addEventListener('change', (event) => {
    const box = event.target.closest('[data-facet]');
    if (!box) return;
    const key = box.dataset.facet;
    const list = catalogState.filters[key] ?? [];

    catalogState.filters[key] = box.checked
      ? [...list, box.value]
      : list.filter((v) => v !== box.value);
    if (catalogState.filters[key].length === 0) delete catalogState.filters[key];
    updateCatalog();
  });

  updateCatalog();
}

/* ==========================================================================
   Страница товара
   ========================================================================== */

function initProduct() {
  const root = document.querySelector('[data-product-root]');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const product = store.getProductById(id);
  const notFound = document.querySelector('[data-not-found]');

  if (!product) {
    root.hidden = true;
    if (notFound) notFound.hidden = false;
    document.title = 'Товар не найден — Pegasus Store';
    setMeta('robots', 'noindex, follow');

    // Скрываем «похожие» и крошки товара — они бессмысленны без товара
    document.querySelector('[data-similar]')?.closest('section')?.setAttribute('hidden', '');
    document.querySelector('[data-crumb-cat-link]')?.setAttribute('hidden', '');
    return;
  }

  root.hidden = false;
  if (notFound) notFound.hidden = true;

  const title = `${product.name} — Pegasus Store`;
  document.title = title;
  setMeta('description', product.description || `${product.name} — ${formatPrice(product.price)}. ${product.category} в Pegasus Store.`);
  setMeta('og:title', title, 'property');
  setMeta('og:description', product.description || product.name, 'property');
  if (product.images[0]) setMeta('og:image', new URL(product.images[0], location.href).href, 'property');
  setCanonical(`${location.origin}${location.pathname}?id=${encodeURIComponent(product.id)}`);

  fill('[data-p-cat]', product.subcategory || product.category);
  fill('[data-p-name]', product.name);
  fill('[data-p-price]', formatPrice(product.price));
  fill('[data-crumb-cat]', product.category);
  fill('[data-crumb-name]', product.name);

  const catCrumb = document.querySelector('[data-crumb-cat-link]');
  if (catCrumb) catCrumb.href = `catalog.html?category=${encodeURIComponent(product.category)}`;

  const desc = document.querySelector('[data-p-desc]');
  if (desc) {
    if (product.description) desc.textContent = product.description;
    else desc.hidden = true;
  }

  renderGallery(product);
  renderSpecs(product);
  renderBuyButton(product);
  injectProductJsonLd(product);

  // Кнопка «в избранное» на странице товара
  const fav = document.querySelector('[data-p-fav]');
  if (fav) {
    fav.dataset.fav = product.id;
    const sync = () => {
      const liked = wishlist.has(product.id);
      fav.setAttribute('aria-pressed', String(liked));
      const label = fav.querySelector('[data-fav-label]');
      if (label) label.textContent = liked ? 'В избранном' : 'В избранное';
    };
    sync();
    document.addEventListener('wishlist:change', sync);
  }

  const similarGrid = document.querySelector('[data-similar]');
  if (similarGrid) {
    const similar = store.getSimilar(product, 4);
    const section = similarGrid.closest('section');
    if (similar.length === 0 && section) section.hidden = true;
    else {
      similarGrid.innerHTML = similar.map((p) => productCard(p)).join('');
      observeReveal(similarGrid);
    }
  }
}

function renderGallery(product) {
  const main = document.querySelector('[data-gallery-main]');
  const thumbs = document.querySelector('[data-gallery-thumbs]');
  if (!main) return;

  const images = product.images.length > 0 ? product.images : [''];
  main.innerHTML = images[0]
    ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)}" width="900" height="900" fetchpriority="high" decoding="async">`
    : `<div class="empty-state">${icon('box', { size: 56 })}<p>Фото готовится</p></div>`;

  if (!thumbs) return;
  if (images.length < 2) { thumbs.hidden = true; return; }

  thumbs.innerHTML = images.map((src, i) => `
    <button type="button" class="gallery__thumb" data-thumb="${i}" aria-current="${i === 0}"
            aria-label="Показать фото ${i + 1}">
      <img src="${escapeHtml(src)}" alt="" loading="lazy" width="180" height="180" decoding="async">
    </button>`).join('');

  // Переключение без перестановки элементов исходного массива
  thumbs.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-thumb]');
    if (!btn) return;
    const index = Number(btn.dataset.thumb);
    const img = main.querySelector('img');
    if (img) { img.src = images[index]; img.alt = product.name; }
    thumbs.querySelectorAll('[data-thumb]').forEach((el) => {
      el.setAttribute('aria-current', String(el === btn));
    });
  });
}

function renderSpecs(product) {
  const host = document.querySelector('[data-specs]');
  if (!host) return;

  const entries = Object.entries(product.specs ?? {});
  if (entries.length === 0) {
    const item = host.closest('.accordion__item');
    if (item) item.hidden = true;
    return;
  }

  host.innerHTML = entries.map(([key, value]) => `
    <div class="specs__row">
      <span class="specs__key">${escapeHtml(key)}</span>
      <span class="specs__val">${escapeHtml(value)}</span>
    </div>`).join('');
}

/**
 * Кнопка покупки. Если ссылки на Авито нет — показываем честное состояние
 * вместо неработающей ссылки, ведущей на саму страницу.
 */
function renderBuyButton(product) {
  const host = document.querySelector('[data-buy]');
  if (!host) return;

  const isValid = /^https?:\/\//i.test(product.avitoLink);
  host.innerHTML = isValid
    ? `<a class="btn btn--primary btn--full" href="${escapeHtml(product.avitoLink)}"
          target="_blank" rel="noopener noreferrer">
         Купить на Авито ${icon('external', { size: 16 })}
       </a>`
    : `<button type="button" class="btn btn--primary btn--full" disabled aria-disabled="true">
         Нет в наличии
       </button>
       <p class="notice">Объявление готовится. Добавьте товар в избранное — вернётесь к нему позже.</p>`;
}

/* ==========================================================================
   Избранное
   ========================================================================== */

function initWishlist() {
  const grid = document.querySelector('[data-wishlist-grid]');
  const empty = document.querySelector('[data-wishlist-empty]');
  if (!grid || !empty) return;

  const paint = () => {
    const ids = wishlist.all();
    const items = store.getProducts().filter((p) => ids.includes(p.id));

    if (items.length === 0) {
      grid.innerHTML = '';
      grid.hidden = true;
      empty.hidden = false;
      return;
    }
    grid.hidden = false;
    empty.hidden = true;
    grid.innerHTML = items.map((p) => productCard(p)).join('');
    observeReveal(grid);
  };

  paint();
  document.addEventListener('wishlist:change', paint);
}

/* ==========================================================================
   SEO helpers
   ========================================================================== */

function setMeta(name, content, attr = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.append(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.append(el);
  }
  el.href = href;
}

/** Микроразметка товара — карточка в выдаче с ценой и наличием. */
function injectProductJsonLd(product) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — ${product.category}`,
    category: product.category,
    image: product.images.map((src) => new URL(src, location.href).href),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'RUB',
      availability: product.avitoLink
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: location.href,
    },
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}

/* ==========================================================================
   Bootstrap
   ========================================================================== */

function fill(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

async function main() {
  initChrome();

  const page = document.body.dataset.page;
  const needsData = ['home', 'catalog', 'product', 'wishlist'].includes(page);
  if (!needsData) return;

  try {
    await store.loadProducts();
  } catch (error) {
    showLoadError(error);
    return;
  }

  if (page === 'home') initHome();
  else if (page === 'catalog') initCatalog();
  else if (page === 'product') initProduct();
  else if (page === 'wishlist') initWishlist();

  observeReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true });
} else {
  main();
}
