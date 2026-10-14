import { describe, expect, it } from 'vitest';
import {
  ORDRE_COMPARATIFS,
  paireOrdonnee,
  toutesLesPaires,
  urlComparatif,
  verdictProfil,
} from './comparatifs';

describe('comparatifs', () => {
  it('publie les 15 paires, chacune une seule fois', () => {
    const paires = toutesLesPaires();
    expect(paires).toHaveLength(15);
    expect(new Set(paires.map(([a, b]) => `${a}-${b}`)).size).toBe(15);
    expect(paires[0]).toEqual(['tiime', 'qonto']);
  });

  it("donne la même URL quel que soit l'ordre des arguments", () => {
    expect(urlComparatif('qonto', 'tiime')).toBe('/comparatif/tiime-vs-qonto');
    expect(urlComparatif('tiime', 'qonto')).toBe('/comparatif/tiime-vs-qonto');
    expect(urlComparatif('shine', 'abby')).toBe('/comparatif/abby-vs-shine');
  });

  it('chaque outil figure dans 5 paires', () => {
    for (const slug of ORDRE_COMPARATIFS) {
      expect(toutesLesPaires().filter((p) => p.includes(slug))).toHaveLength(5);
    }
  });

  it('refuse un outil hors liste ou une paire réflexive', () => {
    expect(() => paireOrdonnee('tiime', 'inconnu')).toThrow(/hors liste/);
    expect(() => paireOrdonnee('tiime', 'tiime')).toThrow(/lui-même/);
  });
});

describe('verdictProfil : inconnu ≠ absent', () => {
  const v = (a: boolean | null, b: boolean | null) =>
    verdictProfil([
      { nom: 'A', porte: a },
      { nom: 'B', porte: b },
    ]);

  it('distingue les six combinaisons', () => {
    expect(v(true, true)).toMatch(/^Les deux répondent/);
    expect(v(true, false)).toBe("A, d'après le périmètre vérifié à ce jour.");
    expect(v(true, null)).toMatch(/pour B, donnée à confirmer/);
    expect(v(null, null)).toMatch(/^Non confirmé pour l’un comme pour l’autre/);
    expect(v(false, null)).toMatch(/^A n'y répond pas.*pour B, donnée à confirmer/);
    expect(v(false, false)).toMatch(/^Aucun des deux/);
  });

  it('une donnée inconnue ne produit jamais un verdict négatif', () => {
    expect(v(null, null)).not.toMatch(/Aucun|n'y répond pas/);
  });
});
