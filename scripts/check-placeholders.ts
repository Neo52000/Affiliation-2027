/**
 * Garde-fou : aucun gabarit à compléter ne doit atteindre le site publié.
 * Les maquettes reçues portent des marqueurs comme « [A RENSEIGNER] » ou
 * « [SOURCE OFFICIELLE À CITER] » : un seul dans dist fait échouer le build.
 * S'y ajoutent, toujours fatals, les placeholders de configuration : « TODO_ »,
 * « todo-domaine » et toute valeur de src/config.ts encore entre crochets
 * (« [téléphone éditeur] »…). Branché en fin de postbuild : Netlify ne publie
 * pas un site dont l'identification légale est incomplète.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PLACEHOLDERS_CONFIG } from '../src/config.ts';

// Sensible à la casse : les maquettes écrivent leurs marqueurs en capitales, alors
// que les exemples de facture montrent volontairement « reçu le [date] ».
const MARQUEURS =
  /\[(?:À|A) (?:RENSEIGNER|REMPLACER|RÉDIGER|REDIGER)|\[(?:URL|SOURCE|POURQUOI|DATE|PRIX|INTRO|POUR QUI|POINT FORT|LIMITE)\b/;

const VARIABLES_LANCEMENT = /TODO_[A-Z_]+|todo-domaine/;

const dist = join(process.cwd(), 'dist');
const fichiers = readdirSync(dist, { recursive: true }).map(String);
const pages = fichiers.filter((f) => f.endsWith('.html'));
// Fichiers servis hors HTML : robots.txt, sitemaps, en-têtes et redirections générés.
const autres = fichiers.filter((f) => /\.(txt|xml)$|(^|\/)_(headers|redirects)$/.test(f));

// Espaces insécables (typographie-dist) et entités HTML ramenés à leur forme saisie.
const normaliser = (texte: string) =>
  texte
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

const erreurs: string[] = [];
const configNonRemplie = new Map<string, number>();
for (const page of [...pages, ...autres]) {
  const html = normaliser(readFileSync(join(dist, page), 'utf8'));
  const m = html.match(MARQUEURS) ?? html.match(VARIABLES_LANCEMENT);
  if (m) erreurs.push(`${page} : « ${html.slice(m.index ?? 0, (m.index ?? 0) + 40)}… »`);
  for (const valeur of PLACEHOLDERS_CONFIG) {
    if (html.includes(valeur)) {
      erreurs.push(`${page} : config non remplie « ${valeur} »`);
      configNonRemplie.set(valeur, (configNonRemplie.get(valeur) ?? 0) + 1);
    }
  }
}

if (configNonRemplie.size) {
  console.error('check-placeholders : valeurs à renseigner dans src/config.ts :');
  for (const [valeur, n] of configNonRemplie) console.error(` - « ${valeur} » (${n} fichier(s))`);
}

if (erreurs.length) {
  console.error(`check-placeholders : ${erreurs.length} occurrence(s) de gabarit à compléter`);
  for (const e of erreurs.slice(0, 20)) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`check-placeholders : ${pages.length} pages, aucun gabarit à compléter.`);
