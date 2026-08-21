import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { NAV_CATEGORIES } from './nav.js';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-ink text-white/80 py-16 pb-8">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="grid gap-12 pb-12 border-b border-white/15 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <div>
            <Logo isLink={false} />
            <p className="mt-4 text-white/60 max-w-[34ch]">
              Летит быстрее ветра. Держит как мрамор.
            </p>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-body font-normal uppercase tracking-[0.2em] text-gold-decor">Каталог</h2>
            <ul className="grid gap-3">
              {NAV_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link to={`/catalog?category=${encodeURIComponent(cat)}`}
                        className="text-white/70 transition-colors duration-150 hover:text-white">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-body font-normal uppercase tracking-[0.2em] text-gold-decor">Покупателю</h2>
            <ul className="grid gap-3">
              <li><Link to="/catalog" className="text-white/70 transition-colors duration-150 hover:text-white">Все товары</Link></li>
              <li><Link to="/wishlist" className="text-white/70 transition-colors duration-150 hover:text-white">Избранное</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 flex flex-wrap gap-4 justify-between text-sm text-white/50">
          <p>© {year} Pegasus Store</p>
          <p>Сделки проходят через Авито</p>
        </div>
      </div>
    </footer>
  );
}
