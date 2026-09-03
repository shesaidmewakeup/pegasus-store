/**
 * После сборки Vite:
 *  1. генерирует sitemap.xml из Supabase (см. generate-sitemap.mjs);
 *  2. копирует index.html в 404.html — SPA-фолбэк для GitHub Pages.
 */
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 1. Sitemap (пишется в public/, поэтому после генерации копируем в dist —
//    Vite копирует public/ до запуска этого скрипта)
const sitemapScript = path.join(root, 'scripts', 'generate-sitemap.mjs');
await import(sitemapScript + '?t=' + Date.now());

const dist = path.join(root, 'dist');
await copyFile(path.join(root, 'public', 'sitemap.xml'), path.join(dist, 'sitemap.xml'));
console.log('sitemap.xml: скопирован в dist');

// 2. 404 fallback
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
await writeFile(path.join(dist, '404.html'), html, 'utf8');
console.log('404.html: скопирован из index.html');
