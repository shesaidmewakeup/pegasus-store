/**
 * Избранное: хранение в localStorage + подписка на изменения.
 * @module wishlist
 */

import { normalizeId } from './utils.js';

const STORAGE_KEY = 'pegasus_wishlist';
const LEGACY_KEY = 'hermes_wishlist';

/** @type {Set<string>} */
let items = new Set();
/** @type {Set<(ids: string[]) => void>} */
const listeners = new Set();

/**
 * Читает список из localStorage, перенося данные со старого ключа.
 * Миграция нужна, чтобы у существующих посетителей не пропало избранное
 * после переименования бренда.
 */
function read() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy !== null) {
        raw = legacy;
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
  } catch {
    // приватный режим или переполненное хранилище — работаем в памяти
    return;
  }

  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    // Все id приводим к строкам: раньше числа из JSON и строки из
    // localStorage не совпадали при сравнении, и избранное «терялось».
    if (Array.isArray(parsed)) items = new Set(parsed.map(normalizeId));
  } catch {
    items = new Set();
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...items]));
  } catch {
    // запись недоступна — состояние живёт до перезагрузки
  }
  const snapshot = [...items];
  listeners.forEach((fn) => fn(snapshot));
}

read();

// Синхронизация между вкладками
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  read();
  const snapshot = [...items];
  listeners.forEach((fn) => fn(snapshot));
});

/**
 * @param {string|number} id
 * @returns {boolean}
 */
export function has(id) {
  return items.has(normalizeId(id));
}

/**
 * Переключает товар в избранном.
 * @param {string|number} id
 * @returns {boolean} true — добавлен, false — удалён
 */
export function toggle(id) {
  const key = normalizeId(id);
  const added = !items.has(key);
  if (added) items.add(key);
  else items.delete(key);
  persist();
  return added;
}

/** @returns {string[]} */
export function all() {
  return [...items];
}

/** @returns {number} */
export function count() {
  return items.size;
}

export function clear() {
  items.clear();
  persist();
}

/**
 * Подписка на изменения; сразу вызывает колбэк с текущим состоянием.
 * @param {(ids: string[]) => void} fn
 * @returns {() => void} отписка
 */
export function subscribe(fn) {
  listeners.add(fn);
  fn([...items]);
  return () => listeners.delete(fn);
}
