import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cleSourceGouv } from './presentation';
import { metierSchema, pointsFamillesSchema } from './schemas';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const lire = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as unknown;

const points = pointsFamillesSchema.parse(lire('src/data/points-familles.json'));
const metiers = new Map(
  readdirSync(join(ROOT, 'src/content/metiers'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => metierSchema.parse(lire(`src/content/metiers/${f}`)))
    .map((m) => [m.slug, m]),
);
const familles = Object.entries(points.familles);

describe('src/data/points-familles.json', () => {
  it('chaque famille publiée a exactement 4 points', () => {
    expect(familles.length).toBeGreaterThan(0);
    for (const [famille, liste] of familles) expect(liste, famille).toHaveLength(4);
  });

  it('chaque point concerne au moins 2 métiers existants de sa famille', () => {
    for (const [famille, liste] of familles) {
      for (const p of liste) {
        expect(p.metiers_concernes.length, p.titre).toBeGreaterThanOrEqual(2);
        for (const slug of p.metiers_concernes) {
          expect(metiers.get(slug)?.famille, `${famille} › ${p.titre} › ${slug}`).toBe(famille);
        }
      }
    }
  });

  it('chaque source est un document .gouv.fr déjà cité par un métier concerné', () => {
    // Un point généralise les fiches : il ne peut s'appuyer que sur un texte
    // qu'une fiche concernée cite déjà (même document, quel que soit le chemin).
    for (const [famille, liste] of familles) {
      for (const p of liste) {
        const citees = new Set(
          p.metiers_concernes.flatMap((s) =>
            (metiers.get(s)?.sources ?? []).map((x) => cleSourceGouv(x.url)),
          ),
        );
        for (const { url } of p.sources) {
          const cle = cleSourceGouv(url);
          expect(cle, `${famille} › ${p.titre} : source hors .gouv.fr ${url}`).not.toBeNull();
          expect(
            citees.has(cle),
            `${famille} › ${p.titre} : ${url} n'est cité par aucun métier concerné`,
          ).toBe(true);
        }
      }
    }
  });

  it('aucune date ni année dans les textes : les dates de la réforme vivent dans echeances.json', () => {
    for (const [famille, liste] of familles) {
      for (const p of liste) {
        expect(`${p.titre} ${p.texte}`, `${famille} › ${p.titre}`).not.toMatch(/\b(19|20)\d\d\b/);
      }
    }
  });
});
