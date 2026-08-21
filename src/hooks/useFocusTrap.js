import { useEffect } from 'react';

const SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Ловушка фокуса: Tab не выходит за пределы контейнера, пока он открыт.
 * @param {import('react').RefObject<HTMLElement | null>} ref
 * @param {boolean} active
 */
export function useFocusTrap(ref, active) {
  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return undefined;

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
  }, [ref, active]);
}
