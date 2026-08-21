"""Генерация apple-touch-icon.png. Запускать после правки products.json.

Примечание: sitemap.xml теперь генерируется автоматически при сборке
(scripts/generate-sitemap.mjs) — править его вручную не нужно.
"""
import os
from PIL import Image, ImageDraw

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(PROJECT_ROOT, 'public')
ASSETS_DIR = os.path.join(PUBLIC_DIR, 'assets')

# apple-touch-icon 180x180 — та же иконка пера, что в favicon.svg и шапке
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
img.save(os.path.join(ASSETS_DIR, 'apple-touch-icon.png'), 'PNG', optimize=True)
print('apple-touch-icon.png: 180x180')
