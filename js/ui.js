/**
 * Переиспользуемые UI-компоненты: карточка товара, шапка, футер, тосты.
 * Шапка и футер собираются здесь, чтобы правка навигации не требовала
 * редактирования пяти HTML-файлов.
 * @module ui
 */

import { escapeHtml, formatPrice, lockScroll, trapFocus } from './utils.js';
import { icon } from './icons.js';
import * as wishlist from './wishlist.js';

/** Категории навигации. Единственное место, где задаётся меню. */
export const NAV_CATEGORIES = [
  'Чехлы',
  'Защитные стекла',
  'Гаджеты',
  'Зарядные устройства',
  'Техника',
];

const BRAND = 'Pegasus Store';
const TAGLINE = 'Летит быстрее ветра. Держит как мрамор.';

/**
 * Разметка карточки товара.
 * @param {import('./store.js').Product} product
 * @param {{eager?: boolean}} [options]
 * @returns {string}
 */
export function productCard(product, options = {}) {
  const { eager = false } = options;
  const name = escapeHtml(product.name);
  const href = `product.html?id=${encodeURIComponent(product.id)}`;
  const [main, alt] = product.images;
  const liked = wishlist.has(product.id);

  const badge = product.isNew
    ? '<span class="card__badge card__badge--gold">Новинка</span>'
    : product.isBestseller
      ? '<span class="card__badge">Хит</span>'
      : '';

  const altImg = alt
    ? `<img src="${escapeHtml(alt)}" alt="" class="card__img card__img--alt" loading="lazy" decoding="async" width="600" height="600">`
    : '';

  const mainImg = main
    ? `<img src="${escapeHtml(main)}" alt="${name}" class="card__img card__img--main${alt ? ' has-alt' : ''}"
         loading="${eager ? 'eager' : 'lazy'}" decoding="async" width="600" height="600"
         ${eager ? 'fetchpriority="high"' : ''}>`
    : `<div class="card__img" role="img" aria-label="${name}"></div>`;

  return `
    <article class="card reveal">
      ${badge}
      <button type="button" class="card__fav" data-fav="${escapeHtml(product.id)}"
              aria-pressed="${liked}" aria-label="${liked ? 'Убрать из избранного' : 'В избранное'}: ${name}">
        ${icon('heart', { size: 20 })}
      </button>
      <a class="card__media" href="${href}" tabindex="-1" aria-hidden="true">
        ${mainImg}${altImg}
      </a>
      <div class="card__body">
        <p class="card__cat">${escapeHtml(product.subcategory || product.category)}</p>
        <h3 class="card__title"><a href="${href}">${name}</a></h3>
        <p class="card__price">${formatPrice(product.price)}</p>
      </div>
    </article>
  `;
}

/**
 * Скелетоны на время загрузки — вместо пустого экрана.
 * @param {number} [count=6]
 * @returns {string}
 */
export function skeletonCards(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-card__media"></div>
      <div class="skeleton-card__body">
        <div class="skeleton skeleton-line skeleton-line--sm"></div>
        <div class="skeleton skeleton-line skeleton-line--lg"></div>
        <div class="skeleton skeleton-line skeleton-line--sm"></div>
      </div>
    </div>
  `).join('');
}

/** Логотип. @param {boolean} [isLink=true] */
function logoMarkup(isLink = true) {
  const inner = `${icon('pegasus', { size: 32, className: 'logo__mark' })}
    <span class="logo__text">${BRAND}</span>`;
  return isLink
    ? `<a class="logo" href="index.html" aria-label="${BRAND} — на главную">${inner}</a>`
    : `<div class="logo">${inner}</div>`;
}

/**
 * Отрисовывает шапку в placeholder [data-header].
 * @param {{active?: string}} [options]
 */
export function renderHeader(options = {}) {
  const host = document.querySelector('[data-header]');
  if (!host) return;
  const { active = '' } = options;

  const navLinks = NAV_CATEGORIES.map((cat) => {
    const current = active === cat ? ' aria-current="page"' : '';
    return `<a class="nav__link" href="catalog.html?category=${encodeURIComponent(cat)}"${current}>${escapeHtml(cat)}</a>`;
  }).join('');

  const catalogCurrent = active === 'catalog' ? ' aria-current="page"' : '';

  host.outerHTML = `
    <header class="header" data-header-root>
      <div class="container header__inner">
        ${logoMarkup()}
        <nav class="nav" aria-label="Основная навигация">
          <a class="nav__link" href="catalog.html"${catalogCurrent}>Каталог</a>
          ${navLinks}
        </nav>
        <div class="header__actions">
          <button type="button" class="icon-btn" data-search-open aria-label="Поиск по каталогу">
            ${icon('search', { size: 20 })}
          </button>
          <a class="icon-btn" href="wishlist.html" aria-label="Избранное">
            ${icon('heart', { size: 20 })}
            <span class="icon-btn__badge" data-fav-count aria-hidden="true">0</span>
          </a>
          <button type="button" class="icon-btn burger" data-menu-open aria-label="Открыть меню"
                  aria-expanded="false" aria-controls="mobile-menu">
            ${icon('menu', { size: 22 })}
          </button>
        </div>
      </div>
    </header>

    <div class="overlay mobile-menu" id="mobile-menu" data-menu hidden>
      <button type="button" class="overlay__close" data-menu-close aria-label="Закрыть меню">
        ${icon('close', { size: 22 })}
      </button>
      <nav class="mobile-menu__inner" aria-label="Мобильная навигация">
        <a class="mobile-menu__link" href="catalog.html">Каталог</a>
        ${NAV_CATEGORIES.map((cat) => `<a class="mobile-menu__link" href="catalog.html?category=${encodeURIComponent(cat)}">${escapeHtml(cat)}</a>`).join('')}
        <a class="mobile-menu__link" href="wishlist.html">Избранное</a>
      </nav>
    </div>

    <div class="overlay search" id="search-modal" data-search hidden>
      <button type="button" class="overlay__close" data-search-close aria-label="Закрыть поиск">
        ${icon('close', { size: 22 })}
      </button>
      <div class="search__inner">
        <div class="search__field">
          <label class="visually-hidden" for="search-input">Поиск товаров</label>
          <input type="search" id="search-input" class="search__input" data-search-input
                 placeholder="Что ищете?" autocomplete="off" spellcheck="false">
        </div>
        <p class="search__hint">Начните вводить название, бренд или категорию</p>
        <div class="grid search__results" data-search-results role="region" aria-live="polite"></div>
      </div>
    </div>
  `;
}

/** Отрисовывает футер в placeholder [data-footer]. */
export function renderFooter() {
  const host = document.querySelector('[data-footer]');
  if (!host) return;

  const year = new Date().getFullYear();
  const catLinks = NAV_CATEGORIES.map(
    (cat) => `<li><a href="catalog.html?category=${encodeURIComponent(cat)}">${escapeHtml(cat)}</a></li>`,
  ).join('');

  host.outerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            ${logoMarkup(false)}
            <p class="footer__tagline">${TAGLINE}</p>
          </div>
          <div>
            <h2 class="footer__title">Каталог</h2>
            <ul class="footer__list">${catLinks}</ul>
          </div>
          <div>
            <h2 class="footer__title">Покупателю</h2>
            <ul class="footer__list">
              <li><a href="catalog.html">Все товары</a></li>
              <li><a href="wishlist.html">Избранное</a></li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">
          <p>© ${year} ${BRAND}</p>
          <p>Сделки проходят через Авито</p>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Всплывающее уведомление.
 * @param {string} message
 */
export function toast(message) {
  let region = document.querySelector('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }

  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon('check', { size: 18 })}<span>${escapeHtml(message)}</span>`;
  region.append(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 240ms';
    setTimeout(() => el.remove(), 260);
  }, 2400);
}

/**
 * Управление модальным окном: фокус, Escape, блокировка прокрутки.
 * @param {HTMLElement} element
 * @returns {{open: () => void, close: () => void, isOpen: () => boolean}}
 */
export function createOverlay(element) {
  let releaseFocus = null;
  let lastFocused = null;

  function open() {
    lastFocused = document.activeElement;
    element.hidden = false;
    // reflow, чтобы сработал transition
    void element.offsetHeight;
    element.dataset.open = 'true';
    lockScroll(true);
    releaseFocus = trapFocus(element);

    // Приоритет — полю ввода: пользователь сразу печатает запрос.
    const target = element.querySelector('input:not([type="hidden"])')
      || element.querySelector('a, button');
    if (target) {
      requestAnimationFrame(() => setTimeout(() => target.focus(), 80));
    }
  }

  function close() {
    element.dataset.open = 'false';
    lockScroll(false);
    if (releaseFocus) releaseFocus();
    releaseFocus = null;
    setTimeout(() => { element.hidden = true; }, 280);
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  const isOpen = () => element.dataset.open === 'true';

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) close();
  });

  return { open, close, isOpen };
}

/**
 * Плавное появление элементов при прокрутке.
 * @param {ParentNode} [root=document]
 */
export function observeReveal(root = document) {
  const targets = root.querySelectorAll('.reveal:not([data-visible])');
  if (targets.length === 0) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => { el.dataset.visible = 'true'; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.visible = 'true';
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '200px 0px 200px 0px' });

  targets.forEach((el) => observer.observe(el));

  // Страховка: если observer по какой-то причине не сработает
  // (нестандартный вьюпорт, снапшот страницы, ошибка прокрутки),
  // контент всё равно станет видимым — пустых секций быть не должно.
  setTimeout(() => {
    targets.forEach((el) => {
      if (!el.dataset.visible) el.dataset.visible = 'true';
    });
  }, 2500);
}

/** Обновляет счётчик избранного в шапке. */
export function bindFavCounter() {
  wishlist.subscribe((ids) => {
    document.querySelectorAll('[data-fav-count]').forEach((el) => {
      el.textContent = String(ids.length);
      el.dataset.visible = ids.length > 0 ? 'true' : 'false';
    });
  });
}

/**
 * Делегированный обработчик кнопок «в избранное».
 * Один слушатель на документ вместо слушателя на каждой карточке.
 */
export function bindFavButtons() {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-fav]');
    if (!btn) return;
    event.preventDefault();

    const added = wishlist.toggle(btn.dataset.fav);
    btn.setAttribute('aria-pressed', String(added));
    toast(added ? 'Добавлено в избранное' : 'Удалено из избранного');

    // На странице избранного карточка должна исчезнуть сразу
    document.dispatchEvent(new CustomEvent('wishlist:change', {
      detail: { id: btn.dataset.fav, added },
    }));
  });
}
