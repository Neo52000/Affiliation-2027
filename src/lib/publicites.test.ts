import { describe, expect, it } from 'vitest';
import {
  campagneActive,
  chevauchements,
  doitReconstruire,
  heureParis,
  jourParis,
  urlAvecUtm,
  veille,
  type CampagneSelection,
} from './publicites';

const c = (p: Partial<CampagneSelection> & { id: string }): CampagneSelection => ({
  emplacement: 'familles',
  familles: [],
  debut: '2026-11-01',
  fin: '2026-11-30',
  active: true,
  ...p,
});

describe('jourParis', () => {
  it('suit le fuseau de Paris, pas l’UTC', () => {
    // 23 h 30 UTC le 31 décembre = 0 h 30 à Paris le 1er janvier.
    expect(jourParis(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
    expect(jourParis(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01');
  });
});

describe('campagneActive', () => {
  const campagnes = [
    c({ id: 'batiment', familles: ['batiment'] }),
    c({ id: 'accueil', emplacement: 'accueil' }),
    c({ id: 'suspendue', emplacement: 'guides', active: false }),
  ];

  it('affiche une campagne entre son début et sa fin, bornes comprises', () => {
    expect(campagneActive(campagnes, 'accueil', '2026-11-01')?.id).toBe('accueil');
    expect(campagneActive(campagnes, 'accueil', '2026-11-30')?.id).toBe('accueil');
    expect(campagneActive(campagnes, 'accueil', '2026-10-31')).toBeNull();
    expect(campagneActive(campagnes, 'accueil', '2026-12-01')).toBeNull();
  });

  it('respecte le ciblage par famille', () => {
    expect(campagneActive(campagnes, 'familles', '2026-11-10', 'batiment')?.id).toBe('batiment');
    expect(campagneActive(campagnes, 'familles', '2026-11-10', 'sante')).toBeNull();
    expect(campagneActive(campagnes, 'familles', '2026-11-10')).toBeNull();
  });

  it('ignore une campagne suspendue', () => {
    expect(campagneActive(campagnes, 'guides', '2026-11-10')).toBeNull();
  });
});

describe('chevauchements', () => {
  it('signale deux campagnes actives sur le même emplacement aux mêmes dates', () => {
    const paires = chevauchements([
      c({ id: 'a' }),
      c({ id: 'b', debut: '2026-11-30', fin: '2026-12-15' }),
    ]);
    expect(paires.map(([x, y]) => `${x.id}/${y.id}`)).toEqual(['a/b']);
  });

  it('accepte des familles disjointes, des dates disjointes ou une campagne suspendue', () => {
    expect(
      chevauchements([
        c({ id: 'a', familles: ['batiment'] }),
        c({ id: 'b', familles: ['sante'] }),
        c({ id: 'c', familles: ['batiment'], debut: '2026-12-01', fin: '2026-12-31' }),
        c({ id: 'd', familles: ['batiment'], active: false }),
      ]),
    ).toEqual([]);
  });

  it('une campagne sans famille cible chevauche toute campagne ciblée', () => {
    expect(chevauchements([c({ id: 'a' }), c({ id: 'b', familles: ['sante'] })])).toHaveLength(1);
  });
});

describe('urlAvecUtm', () => {
  it('ajoute source, support et campagne', () => {
    expect(urlAvecUtm('https://exemple.fr/offre?ref=1', 'promo-11', 'site.fr')).toBe(
      'https://exemple.fr/offre?ref=1&utm_source=site.fr&utm_medium=publicite&utm_campaign=promo-11',
    );
  });

  it('respecte une URL déjà balisée par l’annonceur', () => {
    const u = 'https://exemple.fr/?utm_source=x';
    expect(urlAvecUtm(u, 'promo', 'site.fr')).toBe(u);
  });
});

describe('heureParis', () => {
  it('22 h UTC l’été et 23 h UTC l’hiver donnent minuit à Paris', () => {
    expect(heureParis(new Date('2026-07-01T22:05:00Z'))).toBe(0);
    expect(heureParis(new Date('2026-12-01T23:05:00Z'))).toBe(0);
    expect(heureParis(new Date('2026-12-01T22:05:00Z'))).toBe(23);
  });
});

describe('doitReconstruire', () => {
  const E = ['accueil', 'guides', 'familles'];
  const F = ['batiment', 'sante'];
  const campagnes = [
    c({ id: 'nov', emplacement: 'accueil', debut: '2026-11-01', fin: '2026-11-30' }),
    c({
      id: 'bat',
      emplacement: 'familles',
      familles: ['batiment'],
      debut: '2026-11-10',
      fin: '2026-11-12',
    }),
  ];

  it('reconstruit le jour où une campagne commence ou au lendemain de sa fin', () => {
    expect(doitReconstruire(campagnes, E, F, '2026-10-31', '2026-11-01')).toBe(true);
    expect(doitReconstruire(campagnes, E, F, '2026-11-30', '2026-12-01')).toBe(true);
    expect(doitReconstruire(campagnes, E, F, '2026-11-09', '2026-11-10')).toBe(true);
    expect(doitReconstruire(campagnes, E, F, '2026-11-12', '2026-11-13')).toBe(true);
  });

  it('ne reconstruit pas quand rien ne change, sauf le 1er janvier', () => {
    expect(doitReconstruire(campagnes, E, F, '2026-11-14', '2026-11-15')).toBe(false);
    expect(doitReconstruire([], E, F, '2026-12-31', '2027-01-01')).toBe(true);
  });
});

describe('veille', () => {
  it('suit le calendrier, y compris autour des changements d’heure et des années', () => {
    expect(veille('2026-03-30')).toBe('2026-03-29');
    expect(veille('2026-10-26')).toBe('2026-10-25');
    expect(veille('2027-01-01')).toBe('2026-12-31');
    expect(veille('2028-03-01')).toBe('2028-02-29');
  });
});
