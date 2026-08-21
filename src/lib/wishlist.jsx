/**
 * Избранное: localStorage + контекст. Сохраняем тот же ключ, что и в
 * старой версии (плюс миграцию со старого ключа бренда), чтобы у
 * существующих посетителей не пропало избранное.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeId } from './utils.js';

const STORAGE_KEY = 'pegasus_wishlist';
const LEGACY_KEY = 'hermes_wishlist';

/** @returns {Set<string>} */
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
    return new Set();
  }

  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.map(normalizeId));
  } catch {
    return new Set();
  }
  return new Set();
}

function persist(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // запись недоступна — состояние живёт до перезагрузки
  }
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(read);

  // Синхронизация между вкладками
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setIds(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((id) => {
    const key = normalizeId(id);
    let added = false;
    setIds((prev) => {
      const next = new Set(prev);
      added = !next.has(key);
      if (added) next.add(key);
      else next.delete(key);
      persist(next);
      return next;
    });
    return added;
  }, []);

  const clear = useCallback(() => {
    setIds(() => {
      const next = new Set();
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    ids,
    has: (id) => ids.has(normalizeId(id)),
    toggle,
    clear,
  }), [ids, toggle, clear]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
