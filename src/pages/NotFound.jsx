import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta.js';

export function NotFound() {
  useMeta({
    title: 'Страница не найдена — Pegasus Store',
    description: 'Такой страницы нет. Вернитесь в каталог Pegasus Store.',
  });

  return (
    <div className="container mx-auto max-w-[1280px] px-6 grid place-items-center gap-4 py-[clamp(4rem,14vh,160px)] text-center">
      <p className="font-display text-[clamp(5rem,18vw,11rem)] leading-none text-gold-decor">404</p>
      <h1 className="text-[clamp(2rem,1.4rem+2.8vw,3.5rem]">Страница не найдена</h1>
      <p className="text-muted max-w-[46ch]">
        Возможно, ссылка устарела или адрес введён с ошибкой.
        В каталоге наверняка найдётся что-то интересное.
      </p>
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <Link to="/catalog" className="btn btn-primary">В каталог</Link>
        <Link to="/" className="btn btn-ghost">На главную</Link>
      </div>
    </div>
  );
}
