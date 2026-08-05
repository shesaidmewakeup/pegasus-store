/**
 * Утилиты общего назначения.
 * @module utils
 */

/**
 * Экранирует строку для безопасной вставки в HTML.
 * Защита от XSS: в исходной версии данные товара попадали в innerHTML напрямую,
 * поэтому кавычка или <script> в названии ломали разметку.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

/**
 * Приводит id к строке. Ключевой фикс: localStorage всегда отдаёт строки,
 * а в products.json id — числа, из-за чего сравнение через includes() всегда
 * возвращало false и «Избранное» не работало.
 * @param {unknown} id
 * @returns {string}
 */
export function normalizeId(id) {
  return String(id ?? '');
}

/**
 * Разбирает цену из числа или строки вида "3 190 ₽".
 * Исходная версия вызывала .replace() на числе и падала с TypeError,
 * ломая сортировку по цене.
 * @param {number|string|null|undefined} value
 * @returns {number}
 */
export function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const digits = value.replace(/[^\d]/g, '');
    return digits ? Number.parseInt(digits, 10) : 0;
  }
  return 0;
}

/**
 * Форматирует цену для показа: 3190 → "3 190 ₽".
 * @param {number|string} value
 * @returns {string}
 */
export function formatPrice(value) {
  return `${parsePrice(value).toLocaleString('ru-RU')} ₽`;
}

/**
 * Откладывает вызов до паузы в событиях. Нужен для живого поиска,
 * чтобы не фильтровать массив на каждое нажатие клавиши.
 * @template {(...args: any[]) => void} F
 * @param {F} fn
 * @param {number} [wait=250]
 * @returns {(...args: Parameters<F>) => void}
 */
export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Подсвечивает вхождения запроса в тексте. Текст экранируется до вставки <mark>.
 * @param {string} text
 * @param {string} query
 * @returns {string} HTML-строка
 */
export function highlight(text, query) {
  const safe = escapeHtml(text);
  const q = query.trim();
  if (!q) return safe;
  const escapedQuery = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
}

/**
 * Транслитерирует строку в URL-совместимый slug.
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return String(str)
    .toLowerCase()
    .split('')
    .map((ch) => (ch in map ? map[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ловушка фокуса для модальных окон: Tab не выходит за пределы контейнера.
 * @param {HTMLElement} container
 * @returns {() => void} функция снятия обработчика
 */
export function trapFocus(container) {
  const SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  function onKeydown(event) {
    if (event.key !== 'Tab') return;
    const items = [...container.querySelectorAll(SELECTOR)].filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}

/**
 * Блокирует/разблокирует прокрутку body.
 * @param {boolean} locked
 */
export function lockScroll(locked) {
  document.body.dataset.lock = String(locked);
}
