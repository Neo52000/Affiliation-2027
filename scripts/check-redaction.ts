/**
 * Garde-fou de rédaction (MAINTENANCE.md, règles de rédaction) sur le texte de
 * <main> de chaque page construite : ni tiret cadratin ni demi-cadratin espacé,
 * espaces insécables en place, aucun mot soudé à un lien, ni « En savoir plus »,
 * « Découvrir », « Ce qu'il faut retenir », ni phrase ouverte par « Voici »,
 * « Concrètement » ou « Autrement dit », ni renvoi interne (« TODO.md »). Tableaux et
 * titres de sources exclus des règles de texte.
 * Usage : node --experimental-strip-types scripts/check-redaction.ts
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { verifierRedaction } from '../src/lib/redaction.ts';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) {
  console.error('check-redaction : dist/ absent, lancer le build d’abord.');
  process.exit(1);
}
const pages = readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'));

const erreurs: string[] = [];
const parRegle = new Map<string, number>();
for (const page of pages) {
  for (const { regle, extrait } of verifierRedaction(readFileSync(join(dist, page), 'utf8'))) {
    erreurs.push(`${page} : ${regle} : « ${extrait} »`);
    parRegle.set(regle, (parRegle.get(regle) ?? 0) + 1);
  }
}

if (erreurs.length) {
  console.error(`check-redaction : ${erreurs.length} infraction(s)`);
  for (const [regle, n] of parRegle) console.error(`  ${n} × ${regle}`);
  for (const e of erreurs.slice(0, 40)) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`check-redaction : ${pages.length} pages, aucune infraction.`);
