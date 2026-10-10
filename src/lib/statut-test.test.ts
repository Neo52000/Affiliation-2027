import { describe, expect, it } from 'vitest';
import { libelleStatutTest, phraseEtatTests } from './statut-test';

describe('libelleStatutTest', () => {
  it("n'annonce jamais un test en cours tant qu'aucun n'a commencé", () => {
    expect(libelleStatutTest('a_tester')).toBe('Test à venir');
    expect(libelleStatutTest('teste')).toBe('Testé');
  });
});

describe('phraseEtatTests', () => {
  it('aucun logiciel testé', () => {
    expect(phraseEtatTests(6, 0)).toBe(
      'Aucun des 6 logiciels n’a encore été testé par nos soins : leurs fiches portent la mention « Test à venir » et aucune note.',
    );
    expect(phraseEtatTests(1, 0)).toMatch(/^Le logiciel comparé n’a pas encore été testé/);
  });

  it('une partie testée : accord selon le nombre restant', () => {
    expect(phraseEtatTests(6, 1)).toBe(
      'Logiciels ayant passé notre protocole de test : 1 sur 6. Les 5 autres portent encore la mention « Test à venir », sans note.',
    );
    expect(phraseEtatTests(6, 5)).toBe(
      'Logiciels ayant passé notre protocole de test : 5 sur 6. Le dernier porte encore la mention « Test à venir », sans note.',
    );
  });

  it('tous testés : plus aucun « autres »', () => {
    expect(phraseEtatTests(6, 6)).toBe(
      'Les 6 logiciels comparés ont passé notre protocole de test.',
    );
    expect(phraseEtatTests(1, 1)).toBe('Le logiciel comparé a passé notre protocole de test.');
  });
});
