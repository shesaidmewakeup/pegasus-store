"""Оптимизация изображений: конвертация в WebP и сжатие.

Запускать после добавления новых фото товаров:
    python3 optimize_images.py

Скрипт идемпотентен: уже сжатые файлы пропускаются.
Требуется Pillow (pip install Pillow).
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit('Нужен Pillow: pip install Pillow')

MAX_HERO_WIDTH = 1920
PRODUCT_QUALITY = 85
HERO_QUALITY = 80


def kb(path):
    return os.path.getsize(path) // 1024


def convert_to_webp(path, quality=PRODUCT_QUALITY):
    """Конвертирует PNG/JPEG в WebP рядом с исходником и удаляет оригинал."""
    stem, ext = os.path.splitext(path)
    if ext.lower() == '.webp':
        return None
    target = f'{stem}.webp'
    before = kb(path)
    Image.open(path).save(target, 'WEBP', quality=quality, method=6)
    os.remove(path)
    print(f'  {os.path.basename(path)}: {before} KB -> {kb(target)} KB (webp)')
    return target


def main():
    # 1. Фото товаров
    images_root = os.path.join('assets', 'images')
    if os.path.isdir(images_root):
        print('Фото товаров:')
        converted = 0
        for root, _dirs, files in os.walk(images_root):
            for name in sorted(files):
                if name.lower().endswith(('.png', '.jpg', '.jpeg')):
                    convert_to_webp(os.path.join(root, name))
                    converted += 1
        if converted == 0:
            print('  всё уже в WebP')

    # 2. Hero-изображение: WebP + уменьшенный JPEG-фолбэк
    hero_jpg = os.path.join('assets', 'hero-bg.jpg')
    if os.path.exists(hero_jpg):
        print('Hero:')
        hero = Image.open(hero_jpg).convert('RGB')
        if hero.width > MAX_HERO_WIDTH:
            height = round(hero.height * MAX_HERO_WIDTH / hero.width)
            hero = hero.resize((MAX_HERO_WIDTH, height), Image.LANCZOS)
            hero.save(hero_jpg, 'JPEG', quality=78, optimize=True, progressive=True)
        hero.save(os.path.join('assets', 'hero-bg.webp'), 'WEBP',
                  quality=HERO_QUALITY, method=6)
        print(f'  webp: {kb(os.path.join("assets", "hero-bg.webp"))} KB'
              f' | jpg: {kb(hero_jpg)} KB')

    # 3. og-image: ровно 1200x630 для соцсетей
    og_jpg = os.path.join('assets', 'og-image.jpg')
    if os.path.exists(og_jpg):
        og = Image.open(og_jpg)
        if og.size != (1200, 630):
            og = og.convert('RGB')
            og.thumbnail((1200, 630), Image.LANCZOS)
            canvas = Image.new('RGB', (1200, 630), (248, 246, 242))
            canvas.paste(og, ((1200 - og.width) // 2, (630 - og.height) // 2))
            canvas.save(og_jpg, 'JPEG', quality=82, optimize=True, progressive=True)
        print(f'og-image: {kb(og_jpg)} KB (1200x630)')

    print('\nГотово. Не забудьте обновить пути в products.json, если менялись расширения.')


if __name__ == '__main__':
    main()
