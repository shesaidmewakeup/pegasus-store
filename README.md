# Pegasus Store

Витрина премиальных гаджетов и аксессуаров: чехлы, защитные стёкла, зарядные
устройства и техника. Сделки проходят через безопасную сделку Авито — корзины
и регистрации нет: кнопка «Купить» ведёт прямо в объявление на Авито.

## Стек

- **React 19 + Vite** — SPA с hash-роутером (работает на любом статическом хостинге без настройки сервера)
- **Tailwind CSS v4** — дизайн-токены и утилиты
- **lucide-react** — иконки
- **Python** — настольная CMS (`manager.py`) и вспомогательные скрипты

## Структура

```
├── index.html              Точка входа Vite (SEO-мета, JSON-LD, шрифты)
├── vite.config.js          Сборка, base = /pegasus-store/
├── public/                 Копируется в сборку как есть
│   ├── products.json       Данные каталога — единственный источник правды
│   ├── assets/             Изображения (WebP), hero, og-image, apple-touch-icon
│   ├── catalog.html        Редиректы со старых адресов на новые маршруты
│   ├── product.html
│   ├── wishlist.html
│   ├── favicon.svg, site.webmanifest, robots.txt
├── src/
│   ├── main.jsx / App.jsx  Точка входа, провайдеры, маршруты
│   ├── index.css           Тема (токены), кнопки, карточки, оверлеи
│   ├── lib/                store (загрузка товаров), wishlist, toast, utils
│   ├── hooks/              useMeta (SEO), useFocusTrap
│   ├── components/         Header, Footer, ProductCard, BuyButton, оверлеи…
│   └── pages/              Home, Catalog, Product, Wishlist, NotFound
├── scripts/
│   ├── generate-sitemap.mjs  sitemap.xml из products.json (при сборке)
│   └── postbuild.mjs         404.html + sitemap в dist/
├── .github/workflows/deploy.yml  Авто-деплой на GitHub Pages
├── build.py                Генерация apple-touch-icon
├── optimize_images.py      Сжатие и конвертация изображений в WebP
└── manager.py              Настольная CMS для правки каталога (Tkinter)
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

Каталог редактируется в `public/products.json` — через настольную CMS или вручную.
Новый товар появляется на витрине сразу после обновления страницы: пересборка
не нужна.

Вариант 1 — настольная CMS (рекомендуется):

```bash
python3 manager.py
```

CMS копирует выбранное фото в `public/assets/images/<категория>/`, заполняет
характеристики и сохраняет JSON. Поддерживает и числовые, и строковые ID.

Вариант 2 — вручную отредактировать `public/products.json`.

После добавления фото в новых форматах (не WebP) оптимизируйте картинки:

```bash
python3 optimize_images.py   # нужен Pillow: pip install Pillow
```

### Формат товара

```jsonc
{
  "id": 4,                        // уникальный, число или строка
  "name": "Роутер Xiaomi AX3000T",
  "price": 3190,                  // число в рублях
  "category": "Гаджеты",          // попадает в навигацию и фильтры
  "subcategory": "Роутеры",
  "description": "Текст для карточки товара и meta-описания",
  "images": ["assets/images/gadgets/ax3000t.webp"],
  "filters": { "Бренд": "Xiaomi" },   // чекбоксы в сайдбаре каталога
  "specs":   { "Бренд": "Xiaomi" },   // таблица характеристик на карточке
  "avitoLink": "https://www.avito.ru/...",  // пусто → «Нет в наличии»
  "isBestseller": true,           // показывать в блоке «Популярное»
  "isNew": false                  // бейдж «Новинка»
}
```

`filters` и `specs` — разные вещи: первый управляет фильтрами в сайдбаре
каталога, второй — таблицей характеристик на странице товара. Обычно они
совпадают, но могут отличаться (например, у роутера в `specs` больше строк).

Пустой `avitoLink` — это нормально: кнопка покупки станет неактивной («Нет в
наличии») вместо того, чтобы вести в никуда.

## Деплой

Автоматический деплой на GitHub Pages при пуше в `main`
(`.github/workflows/deploy.yml`). Базовый путь — `/pegasus-store/`.

- SPA-фолбэк: `index.html` копируется в `404.html`, так что любой маршрут
  открывается напрямую.
- Старые адреса `catalog.html`, `product.html?id=…`, `wishlist.html` редиректят
  на новые маршруты.
- `sitemap.xml` генерируется при каждой сборке из `products.json`.

При деплое на свой домен: поменяйте `base` в `vite.config.js` на `/` и
обновите `SITE` в `scripts/generate-sitemap.mjs` и канонические URL в
`index.html`.

## Доступность

- Контраст текста соответствует WCAG AA (золото для текста — `#8a6d3b`,
  светлый оттенок `#d4b88a` используется только как декор)
- Модалки закрываются по Escape, фокус заперт внутри
- Все интерактивные элементы достижимы с клавиатуры, цели нажатия ≥ 44 px
- Анимации отключаются при `prefers-reduced-motion`
