/**
 * Garde-fou : aucun gabarit à compléter ne doit atteindre le site publié.
 * Les maquettes reçues portent des marqueurs comme « [A RENSEIGNER] » ou
 * « [SOURCE OFFICIELLE À CITER] » : un seul dans dist fait échouer le build.
 * (Les variables de lancement TODO_xxx, documentées dans TODO.md, sont hors champ.)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Sensible à la casse : les maquettes écrivent leurs marqueurs en capitales, alors
// que les exemples de facture montrent volontairement « reçu le [date] ».
const MARQUEURS =
  /\[(?:À|A) (?:RENSEIGNER|REMPLACER|RÉDIGER|REDIGER)|\[(?:URL|SOURCE|POURQUOI|DATE|PRIX|INTRO|POUR QUI|POINT FORT|LIMITE)\b/;

const dist = join(process.cwd(), 'dist');
const pages = readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'));

const erreurs: string[] = [];
for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');
  const m = html.match(MARQUEURS);
  if (m) erreurs.push(`${page} : « ${html.slice(m.index ?? 0, (m.index ?? 0) + 40)}… »`);
}

if (erreurs.length) {
  console.error(`check-placeholders : ${erreurs.length} page(s) avec un gabarit à compléter`);
  for (const e of erreurs.slice(0, 20)) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`check-placeholders : ${pages.length} pages, aucun gabarit à compléter.`);
