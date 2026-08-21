import { useEffect, useRef, useState } from 'react';

/**
 * Плавное появление элемента при попадании во вьюпорт.
 * Уважает prefers-reduced-motion и имеет страховку по таймеру,
 * чтобы контент никогда не остался скрытым.
 */
export function Reveal({ as: Tag = 'div', children, className = '', ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || !('IntersectionObserver' in window)
    ) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      });
    }, { threshold: 0, rootMargin: '200px 0px 200px 0px' });

    observer.observe(el);

    // Страховка: контент всё равно станет видимым, даже если observer
    // по какой-то причине не сработает.
    const timer = setTimeout(() => setVisible(true), 2500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'reveal--visible' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
