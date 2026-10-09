/**
 * Génère la présentation partenaires (presentation/dist/) depuis les données du
 * dépôt : échéances, métiers, outils, sources. Aucun chiffre ni aucune date n'est
 * saisi à la main dans le gabarit ; une valeur introuvable fait échouer le build.
 *
 * Sorties :
 * - pitch.html          fragment publié en Artifact (l'hôte ajoute doctype/head/body)
 * - pitch.preview.html  le même, enveloppé comme le fait l'hôte, pour les tests locaux
 * - claims.json         chaque valeur affichée, avec son fichier et son champ d'origine
 *
 * Usage : node --experimental-strip-types scripts/build-presentation.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { SITE } from '../src/config.ts';
import { formatDateFr } from '../src/lib/dates.ts';
import { situerEcheances } from '../src/lib/echeance.ts';
import { ATTRIBUTS_SVG_PICTO, TRACES, type NomPicto } from '../src/lib/pictos.ts';
import { liensActifs } from '../src/lib/liens-affilies.ts';
import {
  EXTRAITS_METIERS,
  compterSourcesGouv,
  echapperHtml,
  espacesFautives,
  extraireTaux,
  formatNombre,
  hotesGouv,
  insecables,
  insererBloc,
  remplirGabarit,
  valeurConfiguree,
  verifierExtrait,
} from '../src/lib/presentation.ts';
import {
  FAMILLES,
  affiliationSchema,
  echeancesSchema,
  metierSchema,
  outilSchema,
} from '../src/lib/schemas.ts';

/** Adresse publique tant que le domaine définitif (TODO.md #2) n'est pas branché. */
const URL_PRODUCTION = 'https://affiliation2027.netlify.app';

const ROOT = process.cwd();
const DOSSIER = join(ROOT, 'presentation');
const SORTIE = join(DOSSIER, 'dist');

const lire = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
const lireJson = (...p: string[]) => JSON.parse(lire(...p)) as unknown;
const fichiers = (dossier: string, motif: RegExp) =>
  readdirSync(join(ROOT, dossier), { recursive: true })
    .map(String)
    .filter((f) => motif.test(f))
    .sort();

interface Affirmation {
  cle: string;
  valeur: string;
  origine: string;
}
const affirmations: Affirmation[] = [];
const noter = (cle: string, valeur: string | number, origine: string): string => {
  const v = String(valeur);
  affirmations.push({ cle, valeur: v, origine });
  return v;
};

/** Texte affiché : typographie française puis échappement HTML. */
const texte = (s: string) => echapperHtml(insecables(s));

function picto(nom: NomPicto, classe = 'picto'): string {
  const attributs = Object.entries(ATTRIBUTS_SVG_PICTO)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<svg class="${classe}" ${attributs} aria-hidden="true">${TRACES[nom]}</svg>`;
}

// ---------------------------------------------------------------------------
// Échéances
// ---------------------------------------------------------------------------
const echeances = echeancesSchema.parse(lireJson('src', 'data', 'echeances.json'));
const situation = situerEcheances('pme-tpe-micro', 'assujetti', echeances.echeances);
const { reception, emission } = situation;
if (!reception || !emission) throw new Error('échéances de réception ou d’émission introuvables');

const origineEch = (e: { id: string }, champ: string) => `src/data/echeances.json#${e.id}.${champ}`;

// ---------------------------------------------------------------------------
// Métiers et familles
// ---------------------------------------------------------------------------
const metiers = fichiers('src/content/metiers', /\.json$/).map((f) =>
  metierSchema.parse(lireJson('src', 'content', 'metiers', f)),
);
const familles = FAMILLES.map((famille) => ({
  famille,
  n: metiers.filter((m) => m.famille === famille).length,
})).filter((f) => f.n > 0);

const cartes = EXTRAITS_METIERS.map((x) => {
  const m = metiers.find((y) => y.slug === x.slug);
  if (!m) throw new Error(`fiche métier introuvable : ${x.slug}`);
  const source = m.besoins_prioritaires[x.index];
  if (!source || !verifierExtrait(source, x.extrait)) {
    throw new Error(
      `extrait infidèle à ${x.slug}.besoins_prioritaires[${x.index}] : « ${x.extrait} »`,
    );
  }
  const origine = `src/content/metiers/${x.slug}.json#besoins_prioritaires[${x.index}]`;
  noter(`carte.${x.slug}.extrait`, x.extrait, origine);
  noter(`carte.${x.slug}.nom`, m.nom, `src/content/metiers/${x.slug}.json#nom`);
  const taux = 'tauxAffiches' in x && x.tauxAffiches ? extraireTaux(source) : [];
  if ('tauxAffiches' in x && x.tauxAffiches && taux.length === 0) {
    throw new Error(`aucun taux trouvé dans ${origine}`);
  }
  taux.forEach((t, i) => noter(`carte.${x.slug}.taux[${i}]`, t, origine));
  const pastilles = taux.length
    ? `<ul class="pastilles" aria-label="Taux de TVA">${taux
        .map((t) => `<li class="pastille">${texte(t)}</li>`)
        .join('')}</ul>`
    : '';
  return {
    sources: m.sources.map((s) => s.url),
    html: `<li class="carte">
          <div class="carte-tete"><span class="picto-carre">${picto(m.famille)}</span><h3>${texte(m.nom)}</h3></div>
          <p>${texte(x.extrait)}</p>${pastilles}
        </li>`,
  };
});

/** Les trois métiers de la scène 2 sont repérables dans le registre de la scène 3. */
const slugsExemples = new Set<string>(EXTRAITS_METIERS.map((x) => x.slug));
const grille = `<ul class="grille" aria-hidden="true">${familles
  .map((f) => {
    const points = metiers
      .filter((m) => m.famille === f.famille)
      .map((m) =>
        slugsExemples.has(m.slug)
          ? `<span class="point point-exemple" data-metier="${m.slug}"></span>`
          : '<span class="point"></span>',
      )
      .join('');
    return `<li class="rang">${picto(f.famille)}${points}</li>`;
  })
  .join('')}</ul>`;
if ((grille.match(/point-exemple/g) ?? []).length !== EXTRAITS_METIERS.length) {
  throw new Error('chaque métier de la scène 2 doit avoir son point dans le registre');
}

// ---------------------------------------------------------------------------
// Outils et comparatifs
// ---------------------------------------------------------------------------
const outils = fichiers('src/content/outils', /\.json$/).map((f) =>
  outilSchema.parse(lireJson('src', 'content', 'outils', f)),
);
const noms = outils.map((o) => o.nom).sort((a, b) => a.localeCompare(b, 'fr'));
const nbComparatifs = (outils.length * (outils.length - 1)) / 2;
const dossierComparatifs = join(ROOT, 'dist', 'comparatif');
if (existsSync(dossierComparatifs)) {
  const construits = readdirSync(dossierComparatifs).filter((f) => f.endsWith('.html')).length;
  if (construits !== nbComparatifs) {
    throw new Error(
      `comparatifs : ${nbComparatifs} attendus (paires de ${outils.length} outils), ${construits} construits`,
    );
  }
}
// Partenariats réellement actifs (liens non null) : le pitch ne laisse jamais
// croire que des partenaires existent déjà.
const affiliation = affiliationSchema.parse(lireJson('src', 'data', 'affiliation.json'));
const nbPartenaires = Object.keys(liensActifs(affiliation)).length;
const etatPartenariats = noter(
  'etatPartenariats',
  nbPartenaires === 0
    ? 'aucun partenariat actif à ce jour'
    : `${nbPartenaires} partenariat${nbPartenaires > 1 ? 's actifs' : ' actif'}`,
  'src/data/affiliation.json#liens (liens actifs avec URL)',
);
const logiciels = `<div class="bloc-logiciels">
        <p class="logiciels-libelle" id="titre-logiciels">Logiciels comparés · ${texte(etatPartenariats)}</p>
        <ul class="logiciels" aria-labelledby="titre-logiciels">${noms
          .map(
            (n, i) =>
              `<li class="logiciel">${texte(noter(`logiciels[${i}]`, n, 'src/content/outils/*.json#nom'))}</li>`,
          )
          .join('')}</ul>
      </div>`;

// ---------------------------------------------------------------------------
// Sources .gouv.fr
// ---------------------------------------------------------------------------
const textesSources = [
  ...fichiers('src/content', /\.(json|mdx?)$/).map((f) => lire('src', 'content', f)),
  ...fichiers('src/data', /\.json$/).map((f) => lire('src', 'data', f)),
];
const nbSources = compterSourcesGouv(textesSources);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const urlCta = valeurConfiguree(SITE.url) ?? URL_PRODUCTION;
const email = valeurConfiguree(SITE.emailContact);
const contact = email
  ? `<p class="contact">Contact partenariats : <strong>${texte(email)}</strong></p>`
  : '';
const versionGsap = (
  JSON.parse(lire('node_modules', 'gsap', 'package.json')) as { version: string }
).version;
let commit = 'inconnu';
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  // hors dépôt git : le tampon reste « inconnu »
}

// ---------------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------------
const valeurs: Record<string, string> = {
  commit,
  dateReleveIso: echeances.date_releve,
  dateEmission: texte(
    noter('dateEmission', formatDateFr(emission.date), origineEch(emission, 'date')),
  ),
  dateReception: texte(
    noter('dateReception', formatDateFr(reception.date), origineEch(reception, 'date')),
  ),
  statutReception: texte(
    noter(
      'statutReception',
      reception.statut === 'en_vigueur' ? 'En vigueur' : 'À venir',
      origineEch(reception, 'statut'),
    ),
  ),
  concernesEmission: texte(
    noter(
      'concernesEmission',
      emission.concernes.replace(/\s*\([^)]*\)\s*$/, ''),
      origineEch(emission, 'concernes'),
    ),
  ),
  sourcesEcheances: texte(
    noter(
      'sourcesEcheances',
      hotesGouv([...reception.sources, ...emission.sources]).join(', '),
      `${origineEch(reception, 'sources')} + ${origineEch(emission, 'sources')}`,
    ),
  ),
  dateReleve: texte(
    noter('dateReleve', formatDateFr(echeances.date_releve), 'src/data/echeances.json#date_releve'),
  ),
  sourcesMetiers: texte(
    noter(
      'sourcesMetiers',
      hotesGouv(cartes.flatMap((c) => c.sources)).join(', '),
      EXTRAITS_METIERS.map((x) => `src/content/metiers/${x.slug}.json#sources`).join(' + '),
    ),
  ),
  nbMetiers: noter('nbMetiers', metiers.length, 'src/content/metiers/*.json (nombre de fiches)'),
  nbFamilles: noter('nbFamilles', familles.length, 'familles présentes dans src/content/metiers'),
  nbLogiciels: noter('nbLogiciels', outils.length, 'src/content/outils/*.json (nombre de fiches)'),
  nbComparatifs: noter(
    'nbComparatifs',
    nbComparatifs,
    'paires d’outils, recoupé avec dist/comparatif/',
  ),
  nbSources: texte(
    noter(
      'nbSources',
      formatNombre(nbSources),
      'documents .gouv.fr distincts cités dans src/content et src/data (règle : src/lib/presentation.ts#cleSourceGouv)',
    ),
  ),
  urlCta: echapperHtml(noter('urlCta', urlCta, 'src/config.ts#url, sinon adresse de production')),
  versionGsap: echapperHtml(versionGsap),
  verbeCommission: noter(
    'verbeCommission',
    nbPartenaires === 0 ? 'ira' : 'va',
    'src/data/affiliation.json#liens (futur tant qu’aucun partenariat n’est actif)',
  ),
  pictoProfil: picto('profil'),
  pictoLoupe: picto('loupe'),
  pictoMedaille: picto('medaille'),
  pictoBouclier: picto('bouclier'),
};

const css = readFileSync(join(DOSSIER, 'pitch.css'), 'utf8');
const client = ts
  .transpileModule(readFileSync(join(DOSSIER, 'pitch.client.ts'), 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      removeComments: false,
    },
  })
  .outputText.replace(/^export \{\};\s*$/m, '');
for (const [nom, code] of [
  ['pitch.css', css],
  ['pitch.client.ts', client],
] as const) {
  if (/<\/(script|style)/i.test(code))
    throw new Error(`${nom} contient une balise fermante interdite`);
}

let page = readFileSync(join(DOSSIER, 'pitch.template.html'), 'utf8');
page = insererBloc(page, 'CSS', `<style>\n${css}</style>`);
page = insererBloc(
  page,
  'CARTES',
  `<ul class="cartes-metier">${cartes.map((c) => c.html).join('')}</ul>`,
);
page = insererBloc(page, 'GRILLE', grille);
page = insererBloc(page, 'LOGICIELS', logiciels);
page = insererBloc(page, 'CONTACT', contact);
page = insererBloc(page, 'CLIENT', `<script>\n${client}</script>`);
page = remplirGabarit(page, valeurs);

// ---------------------------------------------------------------------------
// Garde-fous de sortie
// ---------------------------------------------------------------------------
if (/TODO_|todo-domaine/.test(page)) throw new Error('placeholder de configuration dans la sortie');
if (!page.trimStart().startsWith('<title>')) throw new Error('le <title> doit ouvrir la page');

/** Tout nombre lisible à l'écran doit venir des données (ou numéroter les scènes). */
const contenu = page
  .slice(page.indexOf('<main'), page.indexOf('</main>'))
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ');
const autorises = new Set<string>(['1', '2', '3', '4', '5']);
for (const a of affirmations)
  for (const n of a.valeur.match(/\d+(?:,\d+)?/g) ?? []) autorises.add(n);
const fautives = espacesFautives(contenu.replace(/&nbsp;/g, '\u00a0'));
if (fautives.length) {
  throw new Error(
    `espace ordinaire devant une ponctuation française : « ${fautives.join(' » « ')} »`,
  );
}
const intrus = (contenu.match(/\d+(?:,\d+)?/g) ?? []).filter((n) => !autorises.has(n));
if (intrus.length)
  throw new Error(`nombres affichés sans origine dans les données : ${intrus.join(', ')}`);

mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'pitch.html'), page);
writeFileSync(
  join(SORTIE, 'pitch.preview.html'),
  // Enveloppe équivalente à celle de l'hôte des Artifacts (doctype, viewport, reset).
  `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#fafafa}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${page}
</body>
</html>
`,
);
writeFileSync(join(SORTIE, 'claims.json'), `${JSON.stringify(affirmations, null, 2)}\n`);

console.log(
  `présentation générée : ${metiers.length} métiers, ${familles.length} familles, ${outils.length} outils, ` +
    `${nbComparatifs} comparatifs, ${nbSources} sources .gouv.fr, gsap ${versionGsap}, ` +
    `${Math.round(Buffer.byteLength(page) / 1024)} Ko`,
);
