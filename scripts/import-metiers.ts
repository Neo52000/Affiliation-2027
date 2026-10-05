/**
 * Importe les contenus métier produits par le workflow de rédaction/vérification
 * dans src/content/metiers/*.json, après validation Zod stricte.
 * Usage : node --experimental-strip-types scripts/import-metiers.ts <sortie-workflow.json>
 * La sortie attendue est {"result": [{ "final": <metier>, "verif": <rapport>|null }, ...]}.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { metierSchema } from '../src/lib/schemas.ts';

const source = process.argv[2];
if (!source) {
  console.error('Usage : import-metiers.ts <sortie-workflow.json>');
  process.exit(2);
}

interface Entree {
  final: Record<string, unknown> & { slug?: string };
  verif: {
    conforme: boolean;
    problemes: { champ: string; gravite: string; description: string }[];
    synthese: string;
  } | null;
}

const brut = JSON.parse(readFileSync(source, 'utf8')) as { result?: Entree[] } | Entree[];
const entrees = Array.isArray(brut) ? brut : (brut.result ?? []);

const dir = join(process.cwd(), 'src', 'content', 'metiers');
mkdirSync(dir, { recursive: true });

let ecrits = 0;
const erreurs: string[] = [];

for (const e of entrees) {
  if (!e?.final?.slug) {
    erreurs.push('entrée sans contenu final ou sans slug — ignorée');
    continue;
  }
  const slug = e.final.slug;

  // Un contenu sans rapport de vérification n'est jamais publié (règle du plan).
  if (!e.verif) {
    erreurs.push(`${slug} : AUCUN rapport de vérification — non importé`);
    continue;
  }
  const bloquants = e.verif.problemes.filter((p) => p.gravite === 'bloquant');

  const contenu: Record<string, unknown> = { ...e.final };
  delete contenu['notes_redacteur']; // champ de travail du workflow, hors schéma
  const valide = metierSchema.safeParse(contenu);
  if (!valide.success) {
    erreurs.push(
      `${slug} : schéma invalide — ${valide.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' ; ')}`,
    );
    continue;
  }

  writeFileSync(join(dir, `${slug}.json`), `${JSON.stringify(valide.data, null, 2)}\n`);
  ecrits++;
  const synthese = e.verif.synthese.slice(0, 140).replace(/\s+/g, ' ');
  console.log(
    `✓ ${slug} — vérifié (${e.verif.problemes.length} problème(s) signalés dont ${bloquants.length} bloquant(s) traités par le correcteur) : ${synthese}`,
  );
}

console.log(`\n${ecrits}/${entrees.length} contenus importés.`);
if (erreurs.length > 0) {
  console.error('Problèmes :');
  for (const err of erreurs) console.error(`  - ${err}`);
  process.exit(1);
}
