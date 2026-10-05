import { describe, expect, it } from 'vitest';
import { recommander, type OutilFacts, type QuizReponses } from './quiz';

/** Faits vérifiés des 6 fiches outil (Phase 2) — miroir de src/content/outils. */
const OUTILS: OutilFacts[] = [
  {
    slug: 'tiime',
    nom: 'Tiime',
    comptePro: null,
    compta: true,
    lienExpertComptable: null,
    cibles: ['indépendants', 'freelances', 'tpe', 'micro-entrepreneurs'],
  },
  {
    slug: 'qonto',
    nom: 'Qonto',
    comptePro: true,
    compta: null,
    lienExpertComptable: null,
    cibles: ['pme', 'indépendants'],
  },
  {
    slug: 'pennylane',
    nom: 'Pennylane',
    comptePro: null,
    compta: true,
    lienExpertComptable: true,
    cibles: ['tpe', 'pme', 'experts-comptables'],
  },
  {
    slug: 'abby',
    nom: 'Abby',
    comptePro: null,
    compta: null,
    lienExpertComptable: null,
    cibles: ['indépendants', 'micro-entrepreneurs'],
  },
  {
    slug: 'indy',
    nom: 'Indy',
    comptePro: true,
    compta: true,
    lienExpertComptable: null,
    cibles: ['indépendants'],
  },
  {
    slug: 'shine',
    nom: 'Shine',
    comptePro: true,
    compta: null,
    lienExpertComptable: null,
    cibles: ['indépendants', 'freelances', 'tpe'],
  },
];

const RECOS: Record<string, string[]> = {
  plombier: ['tiime', 'abby', 'pennylane'],
  'infirmier-liberal': ['indy', 'abby', 'tiime'],
};

const base: QuizReponses = {
  metierSlug: null,
  statut: 'ei',
  facturesParMois: '10-50',
  besoinComptePro: false,
  expertComptable: false,
};

const resultat = (r: Partial<QuizReponses>) => recommander({ ...base, ...r }, OUTILS, RECOS);
const slugs = (r: Partial<QuizReponses>) => {
  const res = resultat(r);
  return [res.recommande.slug, ...res.alternatives.map((a) => a.slug)];
};

describe('recommander — structure du résultat', () => {
  it('1. retourne exactement 1 recommandé + 2 alternatives', () => {
    const res = resultat({});
    expect(res.alternatives).toHaveLength(2);
    expect(res.recommande.slug).not.toBe(res.alternatives[0]!.slug);
  });

  it('2. les 3 slugs retournés sont distincts', () => {
    expect(new Set(slugs({})).size).toBe(3);
  });

  it('3. chaque justification fait au plus 2 phrases', () => {
    const res = resultat({ metierSlug: 'plombier', besoinComptePro: true });
    for (const reco of [res.recommande, ...res.alternatives]) {
      expect(reco.justification.split(/(?<=\.)\s+/).length).toBeLessThanOrEqual(2);
    }
  });

  it('4. lève une erreur avec moins de 3 outils', () => {
    expect(() => recommander(base, OUTILS.slice(0, 2), {})).toThrow();
  });
});

describe('recommander — priorité au métier reconnu', () => {
  it('5. le trio du métier domine quand aucune autre contrainte', () => {
    expect(slugs({ metierSlug: 'plombier' })).toEqual(['tiime', 'abby', 'pennylane']);
  });

  it('6. autre métier, autre trio', () => {
    expect(slugs({ metierSlug: 'infirmier-liberal' })).toEqual(['indy', 'abby', 'tiime']);
  });

  it('7. métier inconnu = pas de bonus métier', () => {
    expect(slugs({ metierSlug: 'metier-inconnu' })).toEqual(slugs({ metierSlug: null }));
  });

  it('8. le flag recommandeParMetier est posé sur les outils du trio métier', () => {
    const res = resultat({ metierSlug: 'plombier' });
    expect(res.recommande.recommandeParMetier).toBe(true);
  });
});

describe('recommander — besoin de compte professionnel', () => {
  it('9. favorise un outil à compte pro vérifié', () => {
    expect(slugs({ besoinComptePro: true })[0]).toBe('qonto');
  });

  it('10. peut renverser la tête du trio métier quand le besoin est fort', () => {
    // plombier (tiime +4) + compte pro (qonto +3) + société (qonto +2) => qonto passe devant
    expect(slugs({ metierSlug: 'plombier', besoinComptePro: true, statut: 'societe' })[0]).toBe(
      'qonto',
    );
  });

  it('11. un outil à compte pro non vérifié (null) ne reçoit pas le bonus', () => {
    const res = resultat({ besoinComptePro: true });
    expect(['qonto', 'indy', 'shine']).toContain(res.recommande.slug);
  });

  it('12. la justification mentionne le compte professionnel quand il est le critère', () => {
    const res = resultat({ besoinComptePro: true });
    expect(res.recommande.justification).toContain('compte professionnel');
  });
});

describe('recommander — expert-comptable et statut', () => {
  it('13. avec expert-comptable, Pennylane (lien cabinet vérifié) remonte', () => {
    expect(slugs({ expertComptable: true })[0]).toBe('pennylane');
  });

  it('14. la justification cite le travail avec l’expert-comptable', () => {
    const res = resultat({ expertComptable: true });
    expect(res.recommande.justification).toContain('expert-comptable');
  });

  it('15. statut micro favorise les outils ciblant les micro-entrepreneurs', () => {
    expect(['tiime', 'abby']).toContain(slugs({ statut: 'micro' })[0]);
  });

  it('16. statut société favorise les outils ciblant les PME', () => {
    expect(['qonto', 'pennylane']).toContain(slugs({ statut: 'societe' })[0]);
  });
});

describe('recommander — volume et déterminisme', () => {
  it('17. gros volume favorise la comptabilité intégrée', () => {
    const res = resultat({ facturesParMois: 'plus-50' });
    expect(['tiime', 'pennylane', 'indy']).toContain(res.recommande.slug);
  });

  it('18. sans aucun signal, le départage suit l’ordre stable de la spécification', () => {
    expect(slugs({})).toEqual(['tiime', 'qonto', 'pennylane']);
  });

  it('19. deux appels identiques donnent le même résultat (fonction pure)', () => {
    const r = { metierSlug: 'plombier' as const, besoinComptePro: true };
    expect(resultat(r)).toEqual(resultat(r));
  });

  it('20. aucune justification ne contient de prix, de note ou de superlatif', () => {
    for (const cas of [
      {},
      { metierSlug: 'plombier' },
      { besoinComptePro: true, expertComptable: true, statut: 'micro' as const },
    ]) {
      const res = resultat(cas);
      for (const reco of [res.recommande, ...res.alternatives]) {
        expect(reco.justification).not.toMatch(/€|note|meilleur|n°1|leader/i);
      }
    }
  });
});
