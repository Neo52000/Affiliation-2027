/**
 * Écrit dist/_headers : CSP dont script-src autorise chaque script en ligne du
 * site construit par son empreinte sha256. Lancé par le postbuild (local, CI et
 * Netlify) ; scripts/check-csp.ts vérifie ensuite que rien n'y manque.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { empreinte, fichierHeaders, politique, scriptsEnLigne } from '../src/lib/csp.ts';

const dist = join(process.cwd(), 'dist');
const pages = readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'));

const empreintes = new Set<string>();
for (const page of pages) {
  for (const script of scriptsEnLigne(readFileSync(join(dist, page), 'utf8'))) {
    empreintes.add(empreinte(script));
  }
}

writeFileSync(join(dist, '_headers'), fichierHeaders(politique(empreintes)));
console.log(
  `generate-csp : ${pages.length} pages, ${empreintes.size} script(s) en ligne autorisé(s) par empreinte.`,
);
