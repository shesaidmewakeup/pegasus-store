/**
 * Генерация sitemap.xml на основе public/products.json.
 * Запускается автоматически при сборке (см. scripts/postbuild.mjs).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://shesaidmewakeup.github.io/pegasus-store';
const TODAY = new Date().toISOString().slice(0, 10);

const productsPath = path.join(root, 'public', 'products.json');
const products = JSON.parse(await readFile(productsPath, 'utf8'));

const url = (loc, priority, changefreq) =>
  `  <url>\n` +
  `    <loc>${SITE}${loc}</loc>\n` +
  `    <lastmod>${TODAY}</lastmod>\n` +
  `    <changefreq>${changefreq}</changefreq>\n` +
  `    <priority>${priority}</priority>\n` +
  `  </url>`;

const urls = [
  url('/', '1.0', 'weekly'),
  url('/#/catalog', '0.9', 'weekly'),
];

for (const p of products) {
  const id = encodeURIComponent(String(p.id));
  urls.push(url(`/#/product?id=${id}`, '0.8', 'monthly'));
}

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.join('\n') +
  '\n</urlset>\n';

const out = path.join(root, 'public', 'sitemap.xml');
await writeFile(out, xml, 'utf8');
console.log(`sitemap.xml: ${urls.length} URL`);
