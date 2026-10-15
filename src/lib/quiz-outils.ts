/**
 * Faits transmis au quiz depuis une fiche outil : une seule correspondance,
 * partagée par l'accueil et /outils/quiz (mêmes données que fiches et tableaux).
 */
import type { Outil } from './schemas.ts';
import type { OutilFacts } from './quiz.ts';
import { libelleStatutTest } from './statut-test.ts';

export function faitsQuiz(d: Outil): OutilFacts & { urlOfficielle: string; libelleTest: string } {
  return {
    slug: d.slug,
    nom: d.nom,
    plateformeAgreee: d.est_plateforme_agreee.valeur,
    comptePro: d.fonctionnalites.compte_pro,
    compta: d.fonctionnalites.compta,
    lienExpertComptable: d.fonctionnalites.lien_expert_comptable,
    fonctions: {
      devis: d.fonctionnalites.devis,
      acomptes: d.fonctionnalites.acomptes,
      app_mobile: d.fonctionnalites.app_mobile,
      export_comptable: d.fonctionnalites.export_comptable,
    },
    cibles: d.cible,
    urlOfficielle: d.url_officielle,
    libelleTest: libelleStatutTest(d.statut_test),
  };
}
