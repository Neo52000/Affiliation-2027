import { describe, expect, it } from 'vitest';
import { ORDRE_COMPARATIFS, paireOrdonnee, toutesLesPaires, urlComparatif } from './comparatifs';

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
