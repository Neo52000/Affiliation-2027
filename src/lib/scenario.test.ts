import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { metierSchema } from './schemas';

const dossier = new URL('../content/metiers/', import.meta.url);
const fiches = readdirSync(dossier)
  .filter((f) => f.endsWith('.json'))
  .map((f) => metierSchema.parse(JSON.parse(readFileSync(new URL(f, dossier), 'utf8'))));

describe('cas concrets des fiches métier', () => {
  const avecScenario = fiches.filter((m) => m.scenario);

  it('couvrent au moins les trois pages pilotes', () => {
    expect(avecScenario.map((m) => m.slug)).toEqual(
      expect.arrayContaining(['consultant', 'photographe', 'plombier']),
    );
  });

  it('ne contiennent aucun montant ni aucune date écrite en dur', () => {
    for (const m of avecScenario) {
      const texte = JSON.stringify(m.scenario);
      expect(texte, m.slug).not.toMatch(/\d+(?:[  ,.]\d+)*\s*(?:€|euros?\b)/);
      expect(texte, m.slug).not.toMatch(/\b20\d\d\b/);
    }
  });

  it('sollicitent des fonctions distinctes à chaque étape', () => {
    for (const m of avecScenario) {
      const f = m.scenario!.etapes.map((e) => e.fonction);
      expect(new Set(f).size, m.slug).toBe(f.length);
    }
  });
});
