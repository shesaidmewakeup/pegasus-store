"""Генерация sitemap.xml и apple-touch-icon.png. Запускать после правки products.json."""
import json
from datetime import date
from xml.sax.saxutils import escape

SITE = 'https://hermesss.ru'
TODAY = date.today().isoformat()

STATIC = [
    ('/', '1.0', 'weekly'),
    ('/catalog.html', '0.9', 'weekly'),
]

with open('products.json', encoding='utf-8') as fh:
    products = json.load(fh)

urls = [
    f'  <url>\n'
    f'    <loc>{SITE}{loc}</loc>\n'
    f'    <lastmod>{TODAY}</lastmod>\n'
    f'    <changefreq>{freq}</changefreq>\n'
    f'    <priority>{prio}</priority>\n'
    f'  </url>'
    for loc, prio, freq in STATIC
]

for p in products:
    loc = escape(f'/product.html?id={p["id"]}')
    urls.append(
        f'  <url>\n'
        f'    <loc>{SITE}{loc}</loc>\n'
        f'    <lastmod>{TODAY}</lastmod>\n'
        f'    <changefreq>monthly</changefreq>\n'
        f'    <priority>0.8</priority>\n'
        f'  </url>'
    )

NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'

xml = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    f'<urlset xmlns="{NAMESPACE}">\n'
    + '\n'.join(urls)
    + '\n</urlset>\n'
)

with open('sitemap.xml', 'w', encoding='utf-8') as fh:
    fh.write(xml)
print(f'sitemap.xml: {len(urls)} URL')

# apple-touch-icon 180x180 — та же иконка пера, что в favicon.svg и шапке
try:
    from PIL import Image, ImageDraw

    size = 180
    img = Image.new('RGB', (size, size), (28, 28, 28))
    d = ImageDraw.Draw(img)
    gold = (212, 184, 138)
    # Путь пера из favicon.svg (24x24) масштабируем в 180x180 с полями.
    # Капля-навершие пера:
    d.arc([(56, 24), (152, 120)], start=200, end=20, fill=gold, width=11)
    d.line([(88, 36), (38, 79)], fill=gold, width=11)
    d.line([(38, 79), (38, 143)], fill=gold, width=11)
    d.line([(38, 143), (101, 143)], fill=gold, width=11)
    # Стержень пера по диагонали:
    d.line([(120, 60), (15, 165)], fill=gold, width=11)
    img.save('assets/apple-touch-icon.png', 'PNG', optimize=True)
    print('apple-touch-icon.png: 180x180')
except ImportError:
    print('Pillow не установлен — apple-touch-icon пропущен')
