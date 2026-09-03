# Pegasus Store

Витрина премиальных гаджетов и аксессуаров: чехлы, защитные стёкла, зарядные
устройства и техника. Сделки проходят через безопасную сделку Авито — корзины
и регистрации нет: кнопка «Купить» ведёт прямо в объявление на Авито.

## Стек

- **React 19 + Vite** — SPA с hash-роутером (работает на любом статическом хостинге без настройки сервера)
- **Tailwind CSS v4** — дизайн-токены и утилиты
- **lucide-react** — иконки
- **Supabase** — каталог в таблице `products` (Postgres + RLS), фото — в Storage
- **Python** — настольная CMS (`manager.py`) и вспомогательные скрипты

## Структура

```
├── index.html              Точка входа Vite (SEO-мета, JSON-LD, шрифты)
├── vite.config.js          Сборка, base = /pegasus-store/
├── public/                 Копируется в сборку как есть
│   ├── products.json       Статичный снапшот каталога (справочно; данные — в Supabase)
│   ├── assets/             Изображения (WebP), hero, og-image, apple-touch-icon
│   ├── catalog.html        Редиректы со старых адресов на новые маршруты
│   ├── product.html
│   ├── wishlist.html
│   ├── favicon.svg, site.webmanifest, robots.txt
├── src/
│   ├── main.jsx / App.jsx  Точка входа, провайдеры, маршруты
│   ├── index.css           Тема (токены), кнопки, карточки, оверлеи
│   ├── lib/                store (загрузка из Supabase), supabase, wishlist, toast, utils
│   ├── hooks/              useMeta (SEO), useFocusTrap
│   ├── components/         Header, Footer, ProductCard, BuyButton, оверлеи…
│   └── pages/              Home, Catalog, Product, Wishlist, NotFound
├── scripts/
│   ├── generate-sitemap.mjs  sitemap.xml из Supabase (при сборке)
│   └── postbuild.mjs         404.html + sitemap в dist/
├── .github/workflows/deploy.yml  Авто-деплой на GitHub Pages
├── .env.example            Шаблон переменных окружения (Supabase)
├── requirements.txt        Зависимости Python CMS (requests)
├── build.py                Генерация apple-touch-icon
├── optimize_images.py      Сжатие и конвертация изображений в WebP
└── manager.py              Настольная CMS (Tkinter) — CRUD через Supabase REST
```

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
```

Сборка и превью:

```bash
npm run build      # dist/ + sitemap.xml + 404.html
npm run preview    # проверить собранный сайт
```

## Управление товарами

Каталог хранится в **Supabase**: товары — таблица `products`, фото — публичный
бакет `product-images`. Витрина читает данные напрямую из БД (публичное чтение
через RLS), поэтому новый товар появляется на сайте сразу после обновления
страницы — пересборка не нужна.

Настольная CMS (рекомендуется):

```bash
pip install -r requirements.txt   # нужен только requests
python3 manager.py
```

Перед запуском впишите в `.env` (шаблон — `.env.example`):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service_role ключ из Settings → API>
```

CMS выполняет CRUD через REST API Supabase: при сохранении нового товара
выбранное фото загружается в бакет `product-images`, а в таблицу пишется его
публичный URL. При замене фото или удалении товара старый файл из бакета
удаляется автоматически. `service_role`-ключ нужен для записи — не публикуйте
его и не используйте в коде витрины.

### Формат товара (таблица `products`)

| Колонка | Описание |
|---|---|
| `id` | автоинкремент (identity) |
| `name`, `price`, `category`, `subcategory`, `description` | основные поля |
| `images` | `jsonb`-массив: публичные URL из Storage или относительные пути `assets/...` |
| `filters`, `specs` | `jsonb`-объекты характеристик (`{"Бренд": "Xiaomi"}`) |
| `avito_link` | пусто → кнопка «Нет в наличии» |
| `is_new`, `is_bestseller` | бейджи «Новинка» / блок «Популярное» |
| `sort_order` | порядок выдачи на витрине |

`filters` и `specs` — разные вещи: первый управляет фильтрами в сайдбаре
каталога, второй — таблицей характеристик на странице товара. Обычно они
совпадают, но могут отличаться (например, у роутера в `specs` больше строк).

Пустой `avito_link` — это нормально: кнопка покупки станет неактивной («Нет в
наличии») вместо того, чтобы вести в никуда.

## Деплой

Автоматический деплой на GitHub Pages при пуше в `main`
(`.github/workflows/deploy.yml`). Базовый путь — `/pegasus-store/`.

- SPA-фолбэк: `index.html` копируется в `404.html`, так что любой маршрут
  открывается напрямую.
- Старые адреса `catalog.html`, `product.html?id=…`, `wishlist.html` редиректят
  на новые маршруты.
- `sitemap.xml` генерируется при каждой сборке из Supabase (anon-ключом).
- В секреты репозитория GitHub добавьте `VITE_SUPABASE_URL` и
  `VITE_SUPABASE_ANON_KEY` — их передаёт шаг Build воркфлоу.

При деплое на свой домен: поменяйте `base` в `vite.config.js` на `/` и
обновите `SITE` в `scripts/generate-sitemap.mjs` и канонические URL в
`index.html`.

## Доступность

- Контраст текста соответствует WCAG AA (золото для текста — `#8a6d3b`,
  светлый оттенок `#d4b88a` используется только как декор)
- Модалки закрываются по Escape, фокус заперт внутри
- Все интерактивные элементы достижимы с клавиатуры, цели нажатия ≥ 44 px
- Анимации отключаются при `prefers-reduced-motion`
