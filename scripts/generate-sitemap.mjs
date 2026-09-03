/**
 * Генерация sitemap.xml.
 *
 * Товары запрашиваются из Supabase (таблица products) через REST API —
 * публичное чтение anon-ключом, как у витрины. Переменные окружения:
 *   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * (в GitHub Actions их передаёт шаг Build из секретов репозитория).
 *
 * Запускается автоматически при сборке (см. scripts/postbuild.mjs). Без
 * настроенного Supabase сгенерируется sitemap только со статичными
 * страницами (главная + каталог) — сборка не падает.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://shesaidmewakeup.github.io/pegasus-store';
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * @returns {Promise<Array<{id: string, updated_at?: string}>>}
 */
async function fetchProducts() {
  const url = (process.env.VITE_SUPABASE_URL ?? '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || !anonKey) {
    console.warn(
      '[sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы — товары в sitemap не попадут',
    );
    return [];
  }

  const res = await fetch(`${url}/rest/v1/products?select=id,updated_at&order=id`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) {
    throw new Error(`[sitemap] Supabase вернул ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const url = (loc, priority, changefreq, lastmod = TODAY) =>
  `  <url>\n` +
  `    <loc>${SITE}${loc}</loc>\n` +
  `    <lastmod>${lastmod}</lastmod>\n` +
  `    <changefreq>${changefreq}</changefreq>\n` +
  `    <priority>${priority}</priority>\n` +
  `  </url>`;

const products = await fetchProducts();

const urls = [
  url('/', '1.0', 'weekly'),
  url('/#/catalog', '0.9', 'weekly'),
];

for (const p of products) {
  const id = encodeURIComponent(String(p.id));
  const lastmod = p.updated_at ? String(p.updated_at).slice(0, 10) : TODAY;
  urls.push(url(`/#/product?id=${id}`, '0.8', 'monthly', lastmod));
}

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.join('\n') +
  '\n</urlset>\n';

const out = path.join(root, 'public', 'sitemap.xml');
await writeFile(out, xml, 'utf8');
console.log(`sitemap.xml: ${urls.length} URL`);
