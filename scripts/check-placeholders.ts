/**
 * Garde-fou : aucun gabarit à compléter ne doit atteindre le site publié.
 * Les maquettes reçues portent des marqueurs comme « [A RENSEIGNER] » ou
 * « [SOURCE OFFICIELLE À CITER] » : un seul dans dist fait échouer le build.
 * Les variables de lancement TODO_xxx (TODO.md) sont tolérées tant que
 * l'éditeur n'est pas identifié ; dès qu'il l'est (src/config.ts), plus aucune
 * ne doit subsister : mentions légales, newsletter et annonces sont alors ouvertes.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { EDITEUR_IDENTIFIE } from '../src/config.ts';

// Sensible à la casse : les maquettes écrivent leurs marqueurs en capitales, alors
// que les exemples de facture montrent volontairement « reçu le [date] ».
const MARQUEURS =
  /\[(?:À|A) (?:RENSEIGNER|REMPLACER|RÉDIGER|REDIGER)|\[(?:URL|SOURCE|POURQUOI|DATE|PRIX|INTRO|POUR QUI|POINT FORT|LIMITE)\b/;

const VARIABLES_LANCEMENT = /TODO_[A-Z_]+|todo-domaine/;

const dist = join(process.cwd(), 'dist');
const fichiers = readdirSync(dist, { recursive: true }).map(String);
const pages = fichiers.filter((f) => f.endsWith('.html'));
// Une fois l'éditeur identifié, les fichiers servis hors HTML sont aussi lus
// (robots.txt, sitemaps, en-têtes et redirections générés).
const autres = EDITEUR_IDENTIFIE
  ? fichiers.filter((f) => /\.(txt|xml)$|(^|\/)_(headers|redirects)$/.test(f))
  : [];

const erreurs: string[] = [];
for (const page of [...pages, ...autres]) {
  const html = readFileSync(join(dist, page), 'utf8');
  const m = html.match(MARQUEURS) ?? (EDITEUR_IDENTIFIE ? html.match(VARIABLES_LANCEMENT) : null);
  if (m) erreurs.push(`${page} : « ${html.slice(m.index ?? 0, (m.index ?? 0) + 40)}… »`);
}

if (erreurs.length) {
  console.error(`check-placeholders : ${erreurs.length} page(s) avec un gabarit à compléter`);
  for (const e of erreurs.slice(0, 20)) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`check-placeholders : ${pages.length} pages, aucun gabarit à compléter.`);
