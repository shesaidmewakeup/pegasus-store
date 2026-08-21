import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, Search } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { MobileMenu } from './MobileMenu.jsx';
import { SearchOverlay } from './SearchOverlay.jsx';
import { useWishlist } from '../lib/wishlist.jsx';
import { NAV_CATEGORIES } from './nav.js';

export function Header() {
  const location = useLocation();
  const { ids } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Активная категория: на каталоге подсвечиваем выбранную категорию
  const params = new URLSearchParams(location.search);
  const active = location.pathname === '/catalog'
    ? (params.get('category') || 'catalog')
    : '';

  const navClass = (current) => (
    `relative text-sm tracking-[0.06em] text-ink-soft pb-2 transition-colors duration-150 `
    + `after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:bg-gold `
    + `after:origin-right after:scale-x-0 after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100 `
    + `${current ? 'text-gold after:scale-x-100 after:origin-left' : 'hover:text-gold'}`
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-[72px] flex items-center bg-cream/85 backdrop-blur-xl
                     border-b transition-[border-color,box-shadow] duration-300
                     ${scrolled ? 'border-line shadow-sm' : 'border-transparent'}`}
      >
        <div className="container mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-6">
          <Logo />

          <nav aria-label="Основная навигация" className="hidden md:flex gap-8">
            <Link to="/catalog" className={navClass(active === 'catalog')}>Каталог</Link>
            {NAV_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/catalog?category=${encodeURIComponent(cat)}`}
                className={navClass(active === cat)}
              >
                {cat}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Поиск по каталогу"
              className="w-11 h-11 grid place-items-center rounded-full text-ink transition-[background,color] duration-150 hover:bg-gold-soft hover:text-gold"
            >
              <Search size={20} aria-hidden="true" />
            </button>

            <Link
              to="/wishlist"
              aria-label="Избранное"
              className="relative w-11 h-11 grid place-items-center rounded-full text-ink transition-[background,color] duration-150 hover:bg-gold-soft hover:text-gold"
            >
              <Heart size={20} aria-hidden="true" />
              <span
                aria-hidden="true"
                className={`absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-white
                            text-[10px] font-semibold grid place-items-center transition-transform duration-300
                            ${ids.size > 0 ? 'scale-100' : 'scale-0'}`}
              >
                {ids.size}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="w-11 h-11 grid place-items-center rounded-full text-ink transition-[background,color] duration-150 hover:bg-gold-soft hover:text-gold md:hidden"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
