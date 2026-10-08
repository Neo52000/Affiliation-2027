import { describe, expect, it } from 'vitest';
import { libelleStatutTest } from './statut-test';

describe('libelleStatutTest', () => {
  it("n'annonce jamais un test en cours tant qu'aucun n'a commencé", () => {
    expect(libelleStatutTest('a_tester')).toBe('Test à venir');
    expect(libelleStatutTest('teste')).toBe('Testé');
  });
});
