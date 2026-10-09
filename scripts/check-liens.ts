/**
 * Garde-fou des liens internes : toute URL interne du site rendu doit pointer
 * vers une page réellement construite ou un fichier réellement servi.
 *
 * Ce contrôle existe parce qu'un défaut de ce type est silencieux : les 15 pages
 * de comparatif ont vécu plusieurs phases sans qu'aucun lien n'y mène, et rien
 * ne l'a signalé. Un lien cassé se signale encore moins.
 *
 * Usage : node --experimental-strip-types scripts/check-liens.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { slugsRediriges } from '../src/lib/redirects.ts';

const DIST = join(process.cwd(), 'dist');

if (!existsSync(DIST)) {
  console.error('check-liens : dist/ absent, lancer le build d’abord.');
  process.exit(1);
}

function fichiers(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? fichiers(p) : [p];
  });
}

const tous = fichiers(DIST);

/** Chemins servis tels quels (assets, sitemap, robots…). */
const servis = new Set(tous.map((f) => `/${relative(DIST, f).split('\\').join('/')}`));

/** Routes de page, telles qu'un lien les écrit. */
const routes = new Set<string>();
for (const chemin of servis) {
  if (!chemin.endsWith('.html')) continue;
  const route = chemin.replace(/index\.html$/, '').replace(/\.html$/, '');
  routes.add(route);
  routes.add(route.endsWith('/') && route !== '/' ? route.slice(0, -1) : `${route}/`);
}

/**
 * Les liens affiliés passent par /go/{slug} : des redirections de
 * dist/_redirects (scripts/generate-redirects.ts), sans fichier dans dist/.
 * Chaque lien /go/ des pages doit y avoir sa règle.
 */
const REDIRECTIONS = /^\/go\/([a-z0-9-]+)$/;
const cheminRedirections = join(DIST, '_redirects');
if (!existsSync(cheminRedirections)) {
  console.error('check-liens : dist/_redirects absent (postbuild generate-redirects non lancé).');
  process.exit(1);
}
const rediriges = slugsRediriges(readFileSync(cheminRedirections, 'utf8'));

const casses = new Map<string, Set<string>>();
let analyses = 0;

for (const fichier of tous.filter((f) => f.endsWith('.html'))) {
  const page = relative(DIST, fichier);
  const html = readFileSync(fichier, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const href = m[1]!;
    analyses++;
    const go = REDIRECTIONS.exec(href);
    if ((go && rediriges.has(go[1]!)) || routes.has(href) || servis.has(href)) continue;
    const sans = href.endsWith('/') && href !== '/' ? href.slice(0, -1) : href;
    if (routes.has(sans)) continue;
    if (!casses.has(href)) casses.set(href, new Set());
    casses.get(href)!.add(page);
  }
}

console.log(`check-liens : ${routes.size / 2} pages, ${analyses} liens internes analysés.`);

if (casses.size > 0) {
  console.error(`ÉCHEC : ${casses.size} cible(s) interne(s) introuvable(s).`);
  for (const [href, sources] of casses) {
    const liste = [...sources];
    const extrait = liste.slice(0, 3).join(', ');
    console.error(`  ${href} ← ${extrait}${liste.length > 3 ? ` (+${liste.length - 3})` : ''}`);
  }
  process.exit(1);
}

console.log('OK : toutes les cibles internes existent.');
