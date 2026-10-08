import { describe, expect, it } from 'vitest';
import { FAMILLE_FORMES, FAMILLE_LABELS, estElide, type Famille } from './familles';

const phrase = (f: Famille) => {
  const { pour, objet } = FAMILLE_FORMES[f];
  return `${pour}${estElide(pour) ? '' : ' '}${objet}`;
};

describe('formes grammaticales des familles', () => {
  it('couvre exactement les 10 familles', () => {
    expect(Object.keys(FAMILLE_FORMES).sort()).toEqual(Object.keys(FAMILLE_LABELS).sort());
  });

  it('élide devant une voyelle, jamais ailleurs', () => {
    expect(phrase('artisanat')).toBe('pour l’artisanat');
    expect(phrase('agriculture')).toBe('pour l’agriculture');
    expect(phrase('batiment')).toBe('pour le bâtiment');
    expect(phrase('sante')).toBe('pour la santé');
    expect(phrase('services')).toBe('pour les services');
    for (const f of Object.keys(FAMILLE_FORMES) as Famille[]) {
      const { pour, objet } = FAMILLE_FORMES[f];
      expect(estElide(pour), f).toBe(/^[aeéèiouh]/i.test(objet));
    }
  });

  it('contracte « à le » et « à les »', () => {
    for (const { a } of Object.values(FAMILLE_FORMES)) {
      expect(a).not.toMatch(/\bà le\b|\bà les\b/);
    }
    expect(FAMILLE_FORMES.batiment.a).toBe('au bâtiment');
    expect(FAMILLE_FORMES.liberal.a).toBe('aux professions libérales');
  });
});
