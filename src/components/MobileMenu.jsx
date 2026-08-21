import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Overlay } from './Overlay.jsx';
import { NAV_CATEGORIES } from './nav.js';

/** @param {{ open: boolean, onClose: () => void }} */
export function MobileMenu({ open, onClose }) {
  return (
    <Overlay open={open} onClose={onClose} label="Мобильное меню">
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть меню"
        className="absolute top-4 right-4 w-12 h-12 grid place-items-center rounded-full transition-colors duration-150 hover:bg-gold-soft"
      >
        <X size={22} aria-hidden="true" />
      </button>
      <nav
        aria-label="Мобильная навигация"
        className="h-full flex flex-col justify-center gap-2 px-6 py-16 max-w-[480px] mx-auto"
      >
        <Link to="/catalog" onClick={onClose}
              className="font-display text-2xl py-3 border-b border-line transition-[color,padding-left] duration-300 hover:text-gold hover:pl-3">
          Каталог
        </Link>
        {NAV_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            to={`/catalog?category=${encodeURIComponent(cat)}`}
            onClick={onClose}
            className="font-display text-2xl py-3 border-b border-line transition-[color,padding-left] duration-300 hover:text-gold hover:pl-3"
          >
            {cat}
          </Link>
        ))}
        <Link to="/wishlist" onClick={onClose}
              className="font-display text-2xl py-3 border-b border-line transition-[color,padding-left] duration-300 hover:text-gold hover:pl-3">
          Избранное
        </Link>
      </nav>
    </Overlay>
  );
}
