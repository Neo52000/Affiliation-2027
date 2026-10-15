import { describe, expect, it } from 'vitest';
import { DESCRIPTION_MAX } from './seo';
import { coutDouzeMois, enteteLogiciel, prixEntreeDouzeMois } from './tarifs';

const plan = (o: Partial<Parameters<typeof coutDouzeMois>[0]>) => ({
  nom: 'Offre',
  montant: 10,
  devise: 'EUR' as const,
  base: 'HT' as const,
  periodicite: 'mois' as const,
  engagement: null,
  date_releve: '2026-10-15',
  url_source: 'https://exemple.fr/tarifs',
  ...o,
});

describe('coutDouzeMois', () => {
  it('mensuel × 12, annuel tel quel, base conservée', () => {
    expect(coutDouzeMois(plan({ montant: 9.9 }))).toEqual({ montant: 118.8, base: 'HT' });
    expect(coutDouzeMois(plan({ montant: 120, periodicite: 'an', base: 'TTC' }))).toEqual({
      montant: 120,
      base: 'TTC',
    });
  });

  it('rien sans montant, date ou source', () => {
    expect(coutDouzeMois(plan({ montant: null }))).toBeNull();
    expect(coutDouzeMois(plan({ date_releve: null }))).toBeNull();
    expect(coutDouzeMois(plan({ url_source: null }))).toBeNull();
  });
});

describe('prixEntreeDouzeMois', () => {
  it('offre la moins chère sur 12 mois, HT avant TTC, null sans relevé', () => {
    expect(
      prixEntreeDouzeMois([
        plan({ nom: 'Pro', montant: 20 }),
        plan({ nom: 'Solo', montant: 100, periodicite: 'an' }),
        plan({ nom: 'TTC', montant: 1, base: 'TTC' }),
      ]),
    ).toEqual({ nom: 'Solo', montant: 100, base: 'HT' });
    expect(prixEntreeDouzeMois([plan({ montant: null })])).toBeNull();
    expect(prixEntreeDouzeMois([])).toBeNull();
  });
});

describe('enteteLogiciel', () => {
  it('n’annonce ni tarifs ni limites absents de la page', () => {
    const e = enteteLogiciel('Abby', false, false);
    expect(e.titre).toBe('Abby : avis et fonctions vérifiées');
    expect(e.h1).toBe('Abby : pour qui et avec quelles fonctions ?');
    expect(`${e.titre} ${e.h1} ${e.description}`).not.toMatch(/tarif|prix|limite/i);
  });

  it('bascule dès que les données existent', () => {
    expect(enteteLogiciel('Abby', true, true).titre).toBe('Abby : avis, tarifs et limites');
    expect(enteteLogiciel('Abby', true, true).h1).toBe(
      'Abby : pour qui, à quel prix et avec quelles limites ?',
    );
    expect(enteteLogiciel('Abby', true, false).h1).toBe('Abby : pour qui et à quel prix ?');
    expect(enteteLogiciel('Abby', false, true).titre).toBe('Abby : avis, fonctions et limites');
  });

  it('descriptions sous la borne SEO pour le nom le plus long', () => {
    for (const t of [true, false])
      for (const l of [true, false])
        expect(enteteLogiciel('Pennylane', t, l).description.length).toBeLessThan(DESCRIPTION_MAX);
  });
});
