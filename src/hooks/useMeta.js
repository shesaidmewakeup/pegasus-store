import { useEffect } from 'react';

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

/**
 * Обновляет SEO-метаданные страницы и убирает их при размонтировании.
 * @param {{ title?: string, description?: string, canonical?: string, jsonLd?: object }} meta
 */
export function useMeta({ title, description, canonical, jsonLd } = {}) {
  useEffect(() => {
    const previous = document.title;
    const previousDesc = document.head.querySelector('meta[name="description"]')?.getAttribute('content');
    const previousCanonical = document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');

    if (title) document.title = title;
    if (description) setMeta('description', description);
    if (canonical) setCanonical(canonical);

    let script = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.append(script);
    }

    return () => {
      document.title = previous;
      if (previousDesc) setMeta('description', previousDesc);
      if (previousCanonical) setCanonical(previousCanonical);
      script?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, jsonLd]);
}
