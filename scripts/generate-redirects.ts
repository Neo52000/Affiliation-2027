/**
 * Écrit dist/_redirects (règles /go/{slug} des liens affiliés actifs) depuis
 * src/data/affiliation.json. Lancé par le postbuild — local, CI et Netlify.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { liensActifs } from '../src/lib/liens-affilies.ts';
import { fichierRedirections } from '../src/lib/redirects.ts';
import { affiliationSchema } from '../src/lib/schemas.ts';

const racine = process.cwd();
// Un public/_redirects serait copié dans dist puis écrasé ici sans bruit : interdit.
if (existsSync(join(racine, 'public', '_redirects'))) {
  console.error('generate-redirects : public/_redirects existe ; ajoutez ses règles ici plutôt.');
  process.exit(1);
}
const affiliation = affiliationSchema.parse(
  JSON.parse(readFileSync(join(racine, 'src/data/affiliation.json'), 'utf8')),
);
const actifs = liensActifs(affiliation);

writeFileSync(join(racine, 'dist', '_redirects'), fichierRedirections(actifs));
console.log(
  `generate-redirects : ${Object.keys(actifs).length} redirection(s) /go/ dans dist/_redirects.`,
);
