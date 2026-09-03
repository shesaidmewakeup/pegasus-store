import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, PackageCheck } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.jsx';
import { SkeletonGrid } from '../components/Skeletons.jsx';
import { StoreError } from '../components/StoreError.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { useStore, getFeatured } from '../lib/store.jsx';
import { resolveAsset } from '../lib/utils.js';

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Только оригинал',
    text: 'Каждую позицию проверяем перед публикацией.',
  },
  {
    icon: Truck,
    title: 'Доставка по России',
    text: 'Отправляем в день обращения.',
  },
  {
    icon: PackageCheck,
    title: 'Безопасная сделка',
    text: 'Оплата и гарантии на стороне Авито.',
  },
];

export function Home() {
  const { products, error } = useStore();
  const featured = useMemo(() => (products ? getFeatured(products, 4) : []), [products]);

  return (
    <>
      <section className="relative grid min-h-[min(88vh,760px)] place-items-center overflow-hidden text-center isolate">
        <div className="absolute inset-0 -z-20">
          <picture>
            <source srcSet={resolveAsset('assets/hero-bg.webp')} type="image/webp" />
            <img
              src={resolveAsset('assets/hero-bg.jpg')}
              alt=""
              width={1920}
              height={1280}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
        </div>
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(248,246,242,0.72) 0%, rgba(248,246,242,0.86) 55%, var(--color-cream) 100%)',
          }}
        />
        <div className="container mx-auto max-w-[1280px] px-6 grid gap-6 justify-items-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-medium">Аксессуары и техника</p>
          <h1 className="text-[clamp(2.5rem,1.2rem+6vw,6rem)] leading-[1.02]">
            Скорость <em className="italic text-gold">Пегаса</em>
            <br />в каждой детали
          </h1>
          <p className="text-lg text-muted max-w-[48ch]">
            Отобранные вручную гаджеты и аксессуары. Никаких подделок —
            только то, чем пользуемся сами.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <Link to="/catalog" className="btn btn-primary">Смотреть каталог</Link>
            <Link to="/catalog?category=Чехлы" className="btn btn-gold">Чехлы</Link>
          </div>
        </div>
      </section>

      <section className="py-[clamp(3rem,8vw,6rem)]" aria-labelledby="featured-title">
        <div className="container mx-auto max-w-[1280px] px-6">
          <div className="mb-12 grid justify-items-center gap-3 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-medium">Выбор покупателей</p>
            <h2 className="text-[clamp(2rem,1.4rem+2.8vw,3.5rem]" id="featured-title">Популярное</h2>
          </div>
          {error ? (
            <StoreError error={error} />
          ) : products === null ? (
            <SkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-6 gap-y-8">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} eager={i < 2} />
              ))}
            </div>
          )}
          <div className="mt-12 grid justify-items-center">
            <Link to="/catalog" className="btn btn-ghost">Весь каталог</Link>
          </div>
        </div>
      </section>

      <section className="py-[clamp(3rem,8vw,6rem)] bg-surface" aria-labelledby="benefits-title">
        <div className="container mx-auto max-w-[1280px] px-6">
          <div className="mb-12 grid justify-items-center gap-3 text-center">
            <h2 className="text-[clamp(2rem,1.4rem+2.8vw,3.5rem]" id="benefits-title">Почему мы</h2>
          </div>
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <Reveal key={title} className="grid justify-items-center gap-3 text-center">
                <Icon size={40} className="text-gold" strokeWidth={1.2} aria-hidden="true" />
                <h3 className="text-xl">{title}</h3>
                <p className="text-muted">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
