import { describe, expect, it } from 'vitest';
import { outilsRetenus } from './hub';

const NOMS = { abby: 'Abby', indy: 'Indy', tiime: 'Tiime', qonto: 'Qonto' };
const fiche = (...slugs: string[]) => ({ outils_recommandes: slugs.map((slug) => ({ slug })) });

describe('outilsRetenus', () => {
  it('compte les fiches, trie par nombre puis par nom, sans tronquer les ex æquo', () => {
    const r = outilsRetenus(
      [fiche('tiime', 'abby', 'qonto'), fiche('tiime', 'indy', 'abby'), fiche('qonto', 'indy')],
      NOMS,
    );
    expect(r).toEqual([
      { slug: 'abby', nom: 'Abby', fiches: 2 },
      { slug: 'indy', nom: 'Indy', fiches: 2 },
      { slug: 'qonto', nom: 'Qonto', fiches: 2 },
      { slug: 'tiime', nom: 'Tiime', fiches: 2 },
    ]);
  });

  it('ne compte une fiche qu’une fois par outil', () => {
    expect(outilsRetenus([fiche('abby', 'abby')], NOMS)).toEqual([
      { slug: 'abby', nom: 'Abby', fiches: 1 },
    ]);
  });

  it('échoue sur un outil sans fiche', () => {
    expect(() => outilsRetenus([fiche('inconnu')], NOMS)).toThrow(/sans fiche/);
  });
});
