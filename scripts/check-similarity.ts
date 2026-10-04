/**
 * Garde-fou anti-duplication (règle absolue #5) : échec si deux pages métier
 * construites dépassent une similarité de Jaccard de 0,5 (shingles de 5 mots).
 * Usage : node --experimental-strip-types scripts/check-similarity.ts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { allPairs, extractMainText, JACCARD_MAX } from '../src/lib/similarity.ts';

const dir = join(process.cwd(), 'dist', 'facturation-electronique');

if (!existsSync(dir)) {
  console.log('check-similarity : aucune page métier construite, rien à comparer.');
  process.exit(0);
}

const pages = readdirSync(dir)
  .filter((f) => f.endsWith('.html'))
  .map((f) => ({
    nom: f.replace(/\.html$/, ''),
    texte: extractMainText(readFileSync(join(dir, f), 'utf8')),
  }));

if (pages.length < 2) {
  console.log(`check-similarity : ${pages.length} page métier, rien à comparer.`);
  process.exit(0);
}

const pairs = allPairs(pages);
const enEchec = pairs.filter((p) => p.score > JACCARD_MAX);

console.log(`check-similarity : ${pages.length} pages, ${pairs.length} paires.`);
for (const p of pairs.slice(0, 5)) {
  console.log(`  ${p.a} ↔ ${p.b} : ${(p.score * 100).toFixed(1)} %`);
}

if (enEchec.length > 0) {
  console.error(
    `\nÉCHEC : ${enEchec.length} paire(s) au-dessus du seuil de ${JACCARD_MAX * 100} % :`,
  );
  for (const p of enEchec) console.error(`  ${p.a} ↔ ${p.b} : ${(p.score * 100).toFixed(1)} %`);
  process.exit(1);
}
console.log('OK : aucune paire au-dessus du seuil.');
