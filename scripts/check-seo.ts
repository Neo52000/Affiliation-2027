/**
 * Garde-fou SEO (section 9, règle absolue #5) : title < 60, description < 155,
 * zéro doublon, canonical présent sur toute page indexable.
 * Usage : node --experimental-strip-types scripts/check-seo.ts
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

if (!existsSync(DIST)) {
  console.error('check-seo : dist/ absent, lancer le build d’abord.');
  process.exit(1);
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return f.endsWith('.html') ? [p] : [];
  });
}

const erreurs: string[] = [];
const indexables = new Set<string>();
const horsIndex = new Set<string>();
const route = (page: string) =>
  `/${page.split('\\').join('/')}`.replace(/index\.html$/, '').replace(/\.html$/, '') || '/';
const titles = new Map<string, string>();
const descriptions = new Map<string, string>();

for (const file of htmlFiles(DIST)) {
  const page = relative(DIST, file);
  const html = readFileSync(file, 'utf8');
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  if (noindex) {
    horsIndex.add(route(page)); // 404 et pages exclues de l'index
    continue;
  }
  indexables.add(route(page));

  const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim();
  const desc = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html)?.[1]?.trim();
  const canonical = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html)?.[1];

  if (!title) erreurs.push(`${page} : <title> manquant`);
  else {
    if (title.length >= TITLE_MAX)
      erreurs.push(`${page} : title de ${title.length} caractères (max ${TITLE_MAX - 1})`);
    const deja = titles.get(title);
    if (deja) erreurs.push(`${page} : title dupliqué avec ${deja} (« ${title} »)`);
    titles.set(title, page);
  }

  if (!desc) erreurs.push(`${page} : meta description manquante`);
  else {
    if (desc.length >= DESCRIPTION_MAX)
      erreurs.push(
        `${page} : description de ${desc.length} caractères (max ${DESCRIPTION_MAX - 1})`,
      );
    const deja = descriptions.get(desc);
    if (deja) erreurs.push(`${page} : description dupliquée avec ${deja}`);
    descriptions.set(desc, page);
  }

  if (!canonical) erreurs.push(`${page} : canonical manquant`);
}

// Sitemap et noindex doivent dire la même chose : aucune page non indexée dans
// le sitemap, aucune page indexable oubliée.
const sitemaps = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f));
const dansSitemap = new Set(
  sitemaps.flatMap((f) =>
    [...readFileSync(join(DIST, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => new URL(m[1]!).pathname,
    ),
  ),
);
if (sitemaps.length === 0) erreurs.push('aucun sitemap-N.xml dans dist/');
for (const r of horsIndex) {
  if (dansSitemap.has(r)) erreurs.push(`${r} : page noindex présente dans le sitemap`);
}
for (const r of indexables) {
  if (!dansSitemap.has(r)) erreurs.push(`${r} : page indexable absente du sitemap`);
}

console.log(`check-seo : ${titles.size} pages indexables contrôlées.`);
if (erreurs.length > 0) {
  console.error(`ÉCHEC : ${erreurs.length} problème(s) :`);
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  'OK : titles et descriptions uniques et bornés, canonicals présents, sitemap cohérent avec noindex.',
);
