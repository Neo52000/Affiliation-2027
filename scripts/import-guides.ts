/**
 * Importe les guides produits par le workflow de rédaction/vérification en
 * fichiers MDX src/content/guides/{slug}.mdx, après validation stricte.
 * Usage : node --experimental-strip-types scripts/import-guides.ts <sortie-workflow.json>
 * Sortie attendue : {"result": {"guides": [{ "final": <guide>, "verif": <rapport>|null }]}}.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { guideSchema } from '../src/lib/schemas.ts';

const source = process.argv[2];
if (!source) {
  console.error('Usage : import-guides.ts <sortie-workflow.json>');
  process.exit(2);
}

interface Entree {
  final: {
    slug?: string;
    title?: string;
    description?: string;
    date_maj?: string;
    sources?: { titre: string; url: string }[];
    corps_markdown?: string;
  };
  verif: { problemes: { gravite: string }[]; synthese: string } | null;
}

const brut = JSON.parse(readFileSync(source, 'utf8')) as {
  result?: { guides?: Entree[] };
};
const entrees = brut.result?.guides ?? [];

const dir = join(process.cwd(), 'src', 'content', 'guides');
mkdirSync(dir, { recursive: true });

let ecrits = 0;
const erreurs: string[] = [];

for (const e of entrees) {
  const slug = e?.final?.slug;
  if (!slug) {
    erreurs.push('entrée sans slug — ignorée');
    continue;
  }
  if (!e.verif) {
    erreurs.push(`${slug} : AUCUN rapport de vérification — non importé`);
    continue;
  }
  const corps = (e.final.corps_markdown ?? '').trim();
  const mots = corps.split(/\s+/).length;
  if (mots < 1100 || mots > 2200) {
    erreurs.push(`${slug} : ${mots} mots (attendu ~1200-2000)`);
    continue;
  }
  // MDX : accolades et balises interprétées — le corps doit rester du markdown pur.
  if (/[{}]/.test(corps) || /<(?!https?:)[a-zA-Z!/]/.test(corps)) {
    erreurs.push(`${slug} : corps non-markdown (accolades ou balises) — non importé`);
    continue;
  }

  const frontmatter = {
    title: e.final.title,
    description: e.final.description,
    date_maj: e.final.date_maj,
    sources: e.final.sources,
  };
  const valide = guideSchema.safeParse(frontmatter);
  if (!valide.success) {
    erreurs.push(
      `${slug} : frontmatter invalide — ${valide.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' ; ')}`,
    );
    continue;
  }
  if (valide.data.title.length >= 60 || valide.data.description.length >= 155) {
    erreurs.push(`${slug} : title/description hors limites SEO`);
    continue;
  }

  const fm = [
    '---',
    `title: ${JSON.stringify(valide.data.title)}`,
    `description: ${JSON.stringify(valide.data.description)}`,
    `date_maj: ${JSON.stringify(valide.data.date_maj)}`,
    'sources:',
    ...valide.data.sources.map(
      (s) => `  - titre: ${JSON.stringify(s.titre)}\n    url: ${JSON.stringify(s.url)}`,
    ),
    '---',
  ].join('\n');

  writeFileSync(join(dir, `${slug}.mdx`), `${fm}\n\n${corps}\n`);
  ecrits++;
  const bloquants = e.verif.problemes.filter((p) => p.gravite === 'bloquant').length;
  console.log(`✓ ${slug} — ${mots} mots, vérifié (${bloquants} bloquant(s) traités)`);
}

console.log(`\n${ecrits}/${entrees.length} guides importés.`);
if (erreurs.length > 0) {
  console.error('Problèmes :');
  for (const err of erreurs) console.error(`  - ${err}`);
  process.exit(1);
}
