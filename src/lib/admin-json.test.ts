import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { describe, expect, it } from 'vitest';
import { serialiserJson } from './admin-json';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
// Configuration réelle du dépôt, résolue comme le fait `prettier --check`.
const prettier = async (texte: string) => {
  const fichier = join(ROOT, 'src/data/publicites.json');
  const config = (await resolveConfig(fichier)) ?? {};
  return format(texte, { ...config, plugins: [], filepath: fichier });
};

const exemples: Record<string, unknown> = {
  'affiliation actuelle': JSON.parse(readFileSync(join(ROOT, 'src/data/affiliation.json'), 'utf8')),
  'publicités actuelles': JSON.parse(readFileSync(join(ROOT, 'src/data/publicites.json'), 'utf8')),
  'campagnes variées': {
    date_maj: '2026-11-02',
    campagnes: [
      {
        id: 'exemple-batiment',
        annonceur: 'Exemple SAS',
        emplacement: 'metiers',
        familles: ['batiment', 'artisanat'],
        titre: 'Un titre',
        texte:
          'Un texte d’annonce assez long pour la démonstration, avec « guillemets » et accents.',
        cta: 'Voir l’offre',
        url: 'https://exemple.fr/offre?utm_source=site&utm_medium=annonce',
        image: { fichier: 'exemple-batiment.webp', alt: '' },
        debut: '2026-11-01',
        fin: '2026-11-30',
        active: true,
      },
      {
        id: 'toutes-familles',
        annonceur: 'B',
        emplacement: 'metiers',
        familles: [
          'batiment',
          'sante',
          'commerce',
          'services',
          'liberal',
          'artisanat',
          'numerique',
          'transport',
          'restauration',
          'agriculture',
        ],
        titre: 'Titre',
        texte: 'Texte',
        cta: 'Découvrir',
        url: 'https://b.fr/',
        image: null,
        debut: '2026-12-01',
        fin: '2026-12-31',
        active: false,
      },
    ],
  },
  'liens renseignés': {
    date_maj: '2026-11-02',
    liens: {
      tiime: { url: 'https://a.fr/t?via=x', reseau: 'Affilae', actif: true, maj: '2026-11-02' },
    },
  },
};

describe('serialiserJson', () => {
  it.each(Object.entries(exemples))('%s : sortie identique à Prettier', async (_, valeur) => {
    const sortie = serialiserJson(valeur);
    expect(sortie).toBe(await prettier(sortie));
    expect(JSON.parse(sortie)).toEqual(valeur);
  });

  it('les fichiers du dépôt sont déjà au format produit par le back office', () => {
    for (const f of ['src/data/affiliation.json', 'src/data/publicites.json']) {
      const texte = readFileSync(join(ROOT, f), 'utf8');
      expect(serialiserJson(JSON.parse(texte))).toBe(texte);
    }
  });
});
