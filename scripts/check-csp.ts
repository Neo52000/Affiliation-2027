/**
 * Garde-fou CSP : échoue si un script en ligne du site construit n'est pas
 * autorisé par dist/_headers, ou si netlify.toml déclare aussi une CSP (deux
 * politiques s'intersectent et la plus stricte bloquerait les îlots).
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

if (erreurs.length) {
  console.error(`check-csp : ${erreurs.length} problème(s)`);
  for (const e of erreurs.slice(0, 20)) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`check-csp : ${scripts} scripts en ligne, tous autorisés par empreinte.`);
