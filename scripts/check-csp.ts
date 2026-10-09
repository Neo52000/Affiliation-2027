/**
 * Garde-fou CSP : échoue si un script en ligne du site construit n'est pas
 * autorisé par dist/_headers, si netlify.toml déclare aussi une CSP (deux
 * politiques s'intersectent et la plus stricte bloquerait les îlots), si la
 * CSP autorise une connexion vers un tiers, ou si une page publique charge Zod
 * (réservé au back office : poids, et sonde eval que la CSP interdit).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { empreinte, empreintesAutorisees, scriptsEnLigne } from '../src/lib/csp.ts';

const racine = process.cwd();
const dist = join(racine, 'dist');
const fichier = join(dist, '_headers');
const erreurs: string[] = [];

if (!existsSync(fichier)) {
  erreurs.push('dist/_headers absent : le postbuild (generate-csp) n’a pas tourné.');
}
const autorisees = existsSync(fichier)
  ? empreintesAutorisees(readFileSync(fichier, 'utf8'))
  : new Set();

if (/Content-Security-Policy/.test(readFileSync(join(racine, 'netlify.toml'), 'utf8'))) {
  erreurs.push('netlify.toml déclare une CSP : elle doit vivre uniquement dans dist/_headers.');
}

let scripts = 0;
for (const page of readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'))) {
  for (const script of scriptsEnLigne(readFileSync(join(dist, page), 'utf8'))) {
    scripts++;
    if (!autorisees.has(empreinte(script))) {
      erreurs.push(`${page} : script en ligne non autorisé (${script.trim().slice(0, 60)}…)`);
    }
  }
}

const headers = existsSync(fichier) ? readFileSync(fichier, 'utf8') : '';
const connect = /connect-src ([^;\n]+)/.exec(headers)?.[1]?.trim();
if (connect !== "'self'") {
  erreurs.push(`connect-src doit valoir 'self' (trouvé : ${connect ?? 'absent'})`);
}

// Chunks JavaScript atteints depuis chaque page (îlots, puis imports entre chunks).
const astro = join(dist, '_astro');
const imports = (chunk: string): string[] => {
  const chemin = join(astro, chunk);
  if (!existsSync(chemin)) return [];
  return [
    ...readFileSync(chemin, 'utf8').matchAll(/(?:from|import)\s*\(?\s*["']\.\/([\w.-]+\.js)["']/g),
  ].map((m) => m[1]!);
};
for (const page of readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html') && f !== 'admin.html')) {
  const html = readFileSync(join(dist, page), 'utf8');
  const aVisiter = [...html.matchAll(/(?:component|renderer)-url="\/_astro\/([\w.-]+\.js)"/g)].map(
    (m) => m[1]!,
  );
  const vus = new Set<string>();
  while (aVisiter.length > 0) {
    const chunk = aVisiter.pop()!;
    if (vus.has(chunk)) continue;
    vus.add(chunk);
    if (readFileSync(join(astro, chunk), 'utf8').includes('_zod')) {
      erreurs.push(`${page} charge Zod (${chunk}) : validation réservée au build et à /admin`);
      break;
    }
    aVisiter.push(...imports(chunk));
  }
}

if (erreurs.length) {
  console.error(`check-csp : ${erreurs.length} problème(s)`);
  for (const e of erreurs.slice(0, 20)) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`check-csp : ${scripts} scripts en ligne, tous autorisés par empreinte.`);
