import { describe, expect, it } from 'vitest';
import {
  normaliserMetier,
  outilRetenu,
  recommander,
  trouverMetier,
  type OutilFacts,
  type QuizReponses,
} from './quiz';

/** Faits vérifiés des 6 fiches outil (Phase 2) — miroir de src/content/outils. */
const OUTILS: OutilFacts[] = [
  {
    slug: 'tiime',
    nom: 'Tiime',
    plateformeAgreee: true,
    comptePro: null,
    compta: true,
    lienExpertComptable: null,
    cibles: ['indépendants', 'freelances', 'tpe', 'micro-entrepreneurs'],
  },
  {
    slug: 'qonto',
    nom: 'Qonto',
    plateformeAgreee: true,
    comptePro: true,
    compta: null,
    lienExpertComptable: null,
    cibles: ['pme', 'indépendants'],
  },
  {
    slug: 'pennylane',
    nom: 'Pennylane',
    plateformeAgreee: true,
    comptePro: null,
    compta: true,
    lienExpertComptable: true,
    cibles: ['tpe', 'pme', 'experts-comptables'],
  },
  {
    slug: 'abby',
    nom: 'Abby',
    plateformeAgreee: true,
    comptePro: null,
    compta: null,
    lienExpertComptable: null,
    cibles: ['indépendants', 'micro-entrepreneurs'],
  },
  {
    slug: 'indy',
    nom: 'Indy',
    plateformeAgreee: true,
    comptePro: true,
    compta: true,
    lienExpertComptable: null,
    cibles: ['indépendants'],
  },
  {
    slug: 'shine',
    nom: 'Shine',
    plateformeAgreee: true,
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

const resultat = (r: Partial<QuizReponses>, outils = OUTILS) =>
  recommander({ ...base, ...r }, outils, RECOS);
/** Recommandé présent (cas où au moins un outil est compatible). */
const reco = (r: Partial<QuizReponses>) => resultat(r).recommande!;
const slugs = (r: Partial<QuizReponses>) => {
  const res = resultat(r);
  return [res.recommande!.slug, ...res.alternatives.map((a) => a.slug)];
};

describe('recommander — structure du résultat', () => {
  it('1. retourne exactement 1 recommandé + 2 alternatives', () => {
    const res = resultat({});
    expect(res.alternatives).toHaveLength(2);
    expect(res.recommande!.slug).not.toBe(res.alternatives[0]!.slug);
  });

  it('2. les 3 slugs retournés sont distincts', () => {
    expect(new Set(slugs({})).size).toBe(3);
  });

  it('3. chaque justification fait au plus 2 phrases', () => {
    const res = resultat({ metierSlug: 'plombier', besoinComptePro: true });
    for (const reco of [res.recommande!, ...res.alternatives]) {
      expect(reco.justification.split(/(?<=\.)\s+/).length).toBeLessThanOrEqual(2);
    }
  });

  it('4. avec moins de 3 outils, renvoie ceux qui restent sans erreur', () => {
    const res = recommander(base, OUTILS.slice(0, 2), {});
    expect(res.recommande).not.toBeNull();
    expect(res.alternatives).toHaveLength(1);
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
    expect(reco({ metierSlug: 'plombier' }).recommandeParMetier).toBe(true);
  });
});

describe('recommander — besoin de compte professionnel', () => {
  it('9. favorise un outil à compte pro vérifié', () => {
    // Indy, Qonto et Shine ont un compte pro vérifié : ex æquo, l'ordre alphabétique départage.
    expect(slugs({ besoinComptePro: true })).toEqual(['indy', 'qonto', 'shine']);
  });

  it('10. peut renverser la tête du trio métier quand le besoin est fort', () => {
    // plombier (tiime +4) + compte pro (qonto +3) + société (qonto +2) => qonto passe devant
    expect(slugs({ metierSlug: 'plombier', besoinComptePro: true, statut: 'societe' })[0]).toBe(
      'qonto',
    );
  });

  it('11. un outil à compte pro non vérifié (null) ne reçoit pas le bonus', () => {
    expect(['qonto', 'indy', 'shine']).toContain(reco({ besoinComptePro: true }).slug);
  });

  it('12. la justification mentionne le compte professionnel quand il est le critère', () => {
    expect(reco({ besoinComptePro: true }).justification).toContain('compte professionnel');
  });
});

describe('recommander — expert-comptable et statut', () => {
  it('13. avec expert-comptable, Pennylane (lien cabinet vérifié) remonte', () => {
    expect(slugs({ expertComptable: true })[0]).toBe('pennylane');
  });

  it('14. la justification cite le travail avec l’expert-comptable', () => {
    expect(reco({ expertComptable: true }).justification).toContain('expert-comptable');
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
    expect(['tiime', 'pennylane', 'indy']).toContain(reco({ facturesParMois: 'plus-50' }).slug);
  });

  it('18. sans aucun signal, tous les outils sont ex æquo et aucun n’est mis en avant', () => {
    // Règle publique (page méthode) : pas de départage, ordre d'affichage stable.
    const res = resultat({});
    expect(res.exAequo.map((r) => r.slug)).toEqual([
      'abby',
      'indy',
      'pennylane',
      'qonto',
      'shine',
      'tiime',
    ]);
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
      for (const reco of [res.recommande!, ...res.alternatives]) {
        expect(reco.justification).not.toMatch(/€|note|meilleur|n°1|leader/i);
      }
    }
  });
});

/** Recette du cahier des charges (section 6) : cas complémentaires. */
describe('recommander — recette : inconnues, incompatibilités, égalités', () => {
  it('21. saisie de métier tolérante aux accents, à la casse et aux tirets', () => {
    const metiers = [
      { nom: 'Infirmier libéral', slug: 'infirmier-liberal' },
      { nom: 'Plombier', slug: 'plombier' },
    ];
    expect(trouverMetier('  infirmier LIBERAL ', metiers)).toBe('infirmier-liberal');
    expect(trouverMetier('Infirmier-libéral', metiers)).toBe('infirmier-liberal');
    expect(normaliserMetier('Électricien’ne')).toBe('electricien ne');
  });

  it('22. métier inconnu ou vide : null, sans erreur', () => {
    const metiers = [{ nom: 'Plombier', slug: 'plombier' }];
    expect(trouverMetier('astronaute', metiers)).toBeNull();
    expect(trouverMetier('   ', metiers)).toBeNull();
  });

  it('23. une donnée inconnue est signalée à confirmer, sans exclure ni pénaliser', () => {
    // Abby : compte pro non vérifié (null). Elle reste classée, sans bonus, avec le
    // besoin à confirmer ; Qonto (compte pro vérifié) reçoit la raison correspondante.
    const res = resultat({ metierSlug: 'plombier', besoinComptePro: true });
    const classes = [res.recommande!, ...res.alternatives];
    expect(res.exclus).toEqual([]);
    const abby = classes.find((r) => r.slug === 'abby');
    expect(abby?.aConfirmer).toContain('compte professionnel intégré');
    expect(abby?.raisons).not.toContain('compte professionnel intégré');
    const qonto = recommander({ ...base, besoinComptePro: true }, OUTILS, RECOS).exAequo.find(
      (r) => r.slug === 'qonto',
    );
    expect(qonto?.raisons).toContain('compte professionnel intégré');
  });

  it('24. une fonction indispensable vérifiée absente exclut l’outil, motif publié', () => {
    const outils = OUTILS.map((o) =>
      o.slug === 'tiime' ? { ...o, fonctions: { devis: false } } : o,
    );
    const res = resultat({ metierSlug: 'plombier', indispensables: ['devis'] }, outils);
    expect(res.exclus).toEqual([
      { slug: 'tiime', nom: 'Tiime', motif: 'ne propose pas les devis (donnée vérifiée)' },
    ]);
    expect([res.recommande!.slug, ...res.alternatives.map((a) => a.slug)]).not.toContain('tiime');
  });

  it('25. une fonction indispensable inconnue n’exclut pas et figure à confirmer', () => {
    const res = resultat({ metierSlug: 'plombier', indispensables: ['acomptes'] });
    expect(res.exclus).toEqual([]);
    expect(res.recommande!.aConfirmer).toContain('les factures d’acompte');
  });

  it('26. une fonction indispensable vérifiée présente compte parmi les raisons', () => {
    const outils = OUTILS.map((o) =>
      o.slug === 'abby' ? { ...o, fonctions: { app_mobile: true } } : o,
    );
    const res = resultat({ metierSlug: 'plombier', indispensables: ['app_mobile'] }, outils);
    const abby = [res.recommande!, ...res.alternatives].find((r) => r.slug === 'abby');
    expect(abby?.raisons).toContain('une application mobile (vérifié)');
  });

  it('27. deux scores égaux en tête : exAequo liste les deux, sans gagnant désigné', () => {
    // Micro sans métier : Abby et Tiime ciblent les micro-entrepreneurs (+2 chacun).
    const res = resultat({ statut: 'micro' });
    expect(res.exAequo.map((r) => r.slug)).toEqual(['abby', 'tiime']);
  });

  it('27 bis. la mesure n’attribue un quiz terminé à aucun logiciel en cas d’égalité', () => {
    expect(outilRetenu(resultat({ statut: 'micro' }))).toBe('aucun');
    expect(outilRetenu(resultat({ metierSlug: 'plombier' }))).toBe('tiime');
    const outils = OUTILS.map((o) => ({ ...o, fonctions: { devis: false } }));
    expect(outilRetenu(resultat({ indispensables: ['devis'] }, outils))).toBe('aucun');
  });

  it('28. sans égalité en tête, exAequo est vide', () => {
    expect(resultat({ metierSlug: 'plombier' }).exAequo).toEqual([]);
  });

  it('29. tous incompatibles : aucun recommandé, tous exclus', () => {
    const outils = OUTILS.map((o) => ({ ...o, fonctions: { devis: false } }));
    const res = resultat({ indispensables: ['devis'] }, outils);
    expect(res.recommande).toBeNull();
    expect(res.alternatives).toEqual([]);
    expect(res.exclus).toHaveLength(6);
  });

  it('30. statut de plateforme non confirmé : jamais affirmé, signalé à confirmer', () => {
    const outils = OUTILS.map((o) => (o.slug === 'tiime' ? { ...o, plateformeAgreee: null } : o));
    const tiime = resultat({ metierSlug: 'plombier' }, outils).recommande!;
    expect(tiime.slug).toBe('tiime');
    expect(tiime.justification).not.toContain('est une plateforme agréée');
    expect(tiime.aConfirmer).toContain('statut de plateforme agréée');
  });

  it('31. parcours de l’audit : plombier micro, < 10 factures, sans compte pro ni cabinet', () => {
    const res = resultat({ metierSlug: 'plombier', statut: 'micro', facturesParMois: 'moins-10' });
    // L'éditeur obtenu dépend des données : on vérifie la cohérence, pas un nom figé.
    expect(res.recommande).not.toBeNull();
    expect(res.recommande!.raisons.length).toBeGreaterThan(0);
    expect(res.alternatives).toHaveLength(2);
  });

  it('32. parcours de l’audit : société, > 50 factures, avec expert-comptable', () => {
    const res = resultat({ statut: 'societe', facturesParMois: 'plus-50', expertComptable: true });
    expect(res.recommande).not.toBeNull();
    expect(res.recommande!.raisons).toContain('accès dédié pour l’expert-comptable');
    expect(res.exclus).toEqual([]);
  });
});
