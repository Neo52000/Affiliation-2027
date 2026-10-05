import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  affiliationSchema,
  echeancesSchema,
  ficheTestSchema,
  outilSchema,
  plateformesAgreeesSchema,
} from './schemas';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as unknown;

describe('src/data/echeances.json', () => {
  const data = echeancesSchema.parse(readJson('src/data/echeances.json'));

  it('chaque échéance porte au moins une source officielle en .gouv.fr', () => {
    for (const e of data.echeances) {
      expect(
        e.sources.some((s) => new URL(s).hostname.endsWith('.gouv.fr')),
        `échéance ${e.id} sans source .gouv.fr`,
      ).toBe(true);
    }
  });

  it('couvre les deux dates clés de la réforme', () => {
    const dates = new Set(data.echeances.map((e) => e.date));
    expect(dates).toContain('2026-09-01');
    expect(dates).toContain('2027-09-01');
  });
});

describe('src/data/plateformes-agreees.json', () => {
  const data = plateformesAgreeesSchema.parse(readJson('src/data/plateformes-agreees.json'));

  it('contient le registre complet (165 entrées : 149 définitives + 16 en attente)', () => {
    expect(data.plateformes).toHaveLength(165);
    expect(data.plateformes.filter((p) => p.statut === 'immatriculation_definitive')).toHaveLength(
      149,
    );
    expect(data.plateformes.filter((p) => p.statut === 'dossier_en_attente')).toHaveLength(16);
  });

  it('une entrée en attente ne porte jamais de date d’immatriculation', () => {
    for (const p of data.plateformes) {
      if (p.statut === 'dossier_en_attente') expect(p.date_immatriculation).toBeNull();
    }
  });

  it('référence les 6 outils du lancement', () => {
    const noms = data.plateformes.map((p) => p.nom.toLowerCase());
    for (const attendu of ['tiime', 'qonto', 'pennylane', 'abby', 'indy', 'shine']) {
      expect(
        noms.some((n) => n.includes(attendu)),
        `${attendu} absent du registre`,
      ).toBe(true);
    }
  });
});

describe('src/data/affiliation.json', () => {
  const data = affiliationSchema.parse(readJson('src/data/affiliation.json'));

  it('couvre les 6 outils du lancement', () => {
    expect(Object.keys(data.liens).sort()).toEqual([
      'abby',
      'indy',
      'pennylane',
      'qonto',
      'shine',
      'tiime',
    ]);
  });
});

describe('src/content/outils + src/content/tests', () => {
  const outilsDir = join(ROOT, 'src/content/outils');
  const outils = readdirSync(outilsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: f, data: outilSchema.parse(readJson(`src/content/outils/${f}`)) }));

  it('les 6 fiches outil valident le schéma et portent le slug de leur fichier', () => {
    expect(outils).toHaveLength(6);
    for (const { file, data } of outils) {
      expect(`${data.slug}.json`).toBe(file);
    }
  });

  it('aucune note tant que statut_test = a_tester (règle /methode)', () => {
    for (const { data } of outils) {
      if (data.statut_test === 'a_tester') {
        expect(Object.values(data.notes).every((n) => n === null)).toBe(true);
      }
    }
  });

  it('tout plan renseigné porte un prix OU un prix null, mais toujours date et URL si prix non null', () => {
    for (const { data } of outils) {
      for (const plan of data.plans) {
        if (plan.prix_ht_mensuel !== null) {
          expect(
            plan.date_releve,
            `${data.slug}/${plan.nom} : prix sans date de relevé`,
          ).not.toBeNull();
          expect(plan.url_source, `${data.slug}/${plan.nom} : prix sans URL source`).not.toBeNull();
        }
      }
    }
  });

  it('chaque fiche outil a une fiche de test associée', () => {
    const testsDir = join(ROOT, 'src/content/tests');
    const tests = readdirSync(testsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ficheTestSchema.parse(readJson(`src/content/tests/${f}`)));
    const slugsTestes = new Set(tests.map((t) => t.outil_slug));
    for (const { data } of outils) {
      expect(slugsTestes.has(data.slug), `pas de fiche de test pour ${data.slug}`).toBe(true);
    }
  });
});
