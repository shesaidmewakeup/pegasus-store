/**
 * Утилиты общего назначения.
 */

/**
 * Приводит id к строке. Ключевой фикс: localStorage всегда отдаёт строки,
 * а в products.json id могут быть числами — сравнение через includes()
 * без приведения всегда возвращало false.
 * @param {unknown} id
 * @returns {string}
 */
export function normalizeId(id) {
  return String(id ?? '');
}

/**
 * Разбирает цену из числа или строки вида "3 190 ₽".
 * @param {number|string|null|undefined} value
 * @returns {number}
 */
export function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
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
 * Экранирует строку для безопасной вставки в HTML.
 * Нужен только для подсветки поиска (dangerouslySetInnerHTML) — в остальных
 * местах React экранирует сам.
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
 * Возвращает HTML с подсветкой вхождений запроса (<mark>).
 * Текст экранируется до вставки разметки — безопасно для innerHTML.
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */
export function highlightHtml(text, query) {
  const safe = escapeHtml(text);
  const q = query.trim();
  if (!q) return safe;
  const escapedQuery = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
}

/**
 * Превращает путь из products.json в корректный URL с учётом базового пути
 * приложения (подпапка GitHub Pages). Абсолютные http-ссылки не трогаем.
 * @param {string} path
 * @returns {string}
 */
export function resolveAsset(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

/**
 * Склонение слова «товар» по русской морфологии.
 * @param {number} n
 * @returns {string}
 */
export function pluralGoods(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'товар';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'товара';
  return 'товаров';
}
