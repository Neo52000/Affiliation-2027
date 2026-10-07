/**
 * Logique pure du quiz de recommandation (section 7 de la spécification).
 * Entrées : métier, statut, volume de factures, besoin de compte pro,
 * présence d'un expert-comptable. La commission n'est JAMAIS une entrée.
 * Sortie : 1 outil recommandé + 2 alternatives, justification en 2 phrases.
 */

export interface OutilFacts {
  slug: string;
  nom: string;
  /** Faits vérifiés des fiches outil (null = non vérifié, ne compte pas) */
  comptePro: boolean | null;
  compta: boolean | null;
  lienExpertComptable: boolean | null;
  /** Cible revendiquée par l'éditeur (minuscules) */
  cibles: string[];
}

export interface QuizReponses {
  /** slug du métier si l'autocomplétion a reconnu la saisie, sinon null */
  metierSlug: string | null;
  statut: 'micro' | 'ei' | 'societe';
  facturesParMois: 'moins-10' | '10-50' | 'plus-50';
  besoinComptePro: boolean;
  expertComptable: boolean;
}

export interface Recommandation {
  slug: string;
  nom: string;
  justification: string;
  recommandeParMetier: boolean;
}

export interface QuizResultat {
  recommande: Recommandation;
  alternatives: Recommandation[];
}

function justifier(o: OutilFacts, r: QuizReponses, parMetier: boolean): string {
  const atouts: string[] = [];
  if (r.besoinComptePro && o.comptePro === true)
    atouts.push('propose aussi un compte professionnel');
  if (r.expertComptable && o.lienExpertComptable === true)
    atouts.push('est pensé pour travailler avec votre expert-comptable');
  else if (o.compta === true) atouts.push('intègre la comptabilité');
  const p1 =
    atouts.length > 0
      ? `${o.nom} est une plateforme agréée qui ${atouts.slice(0, 2).join(' et ')}.`
      : `${o.nom} est une plateforme agréée : émission, réception et e-reporting sans intermédiaire.`;
  const p2 = parMetier
    ? `C'est aussi l'un des outils que nous recommandons pour votre métier.`
    : `L'éditeur cible notamment : ${o.cibles.join(', ')}.`;
  return `${p1} ${p2}`;
}

/**
 * Score fondé uniquement sur des faits vérifiés (statut PA, périmètre, cible)
 * et sur les recommandations métier déjà publiées. Jamais sur les commissions.
 */
export function recommander(
  reponses: QuizReponses,
  outils: OutilFacts[],
  recosParMetier: Record<string, string[]>,
): QuizResultat {
  const recosMetier = reponses.metierSlug ? (recosParMetier[reponses.metierSlug] ?? []) : [];

  const scores = outils.map((o) => {
    let score = 0;
    const rangMetier = recosMetier.indexOf(o.slug);
    if (rangMetier === 0) score += 4;
    else if (rangMetier === 1) score += 3;
    else if (rangMetier === 2) score += 2;

    if (reponses.besoinComptePro && o.comptePro === true) score += 3;
    if (reponses.expertComptable && o.lienExpertComptable === true) score += 2;
    if (reponses.statut === 'micro' && o.cibles.some((c) => c.includes('micro'))) score += 2;
    if (reponses.statut === 'societe' && o.cibles.some((c) => c.includes('pme'))) score += 2;
    if (reponses.facturesParMois === 'plus-50' && o.compta === true) score += 1;

    return { o, score };
  });

  // À égalité de score, l'ordre alphabétique départage : une règle publique
  // (page méthode), qui ne code aucune préférence entre éditeurs.
  const tries = scores.sort((a, b) => b.score - a.score || a.o.nom.localeCompare(b.o.nom, 'fr'));

  const [premier, ...reste] = tries;
  if (!premier || reste.length < 2) {
    throw new Error('recommander : au moins 3 outils requis');
  }
  const versReco = ({ o }: { o: OutilFacts }): Recommandation => ({
    slug: o.slug,
    nom: o.nom,
    justification: justifier(o, reponses, recosMetier.includes(o.slug)),
    recommandeParMetier: recosMetier.includes(o.slug),
  });

  return {
    recommande: versReco(premier),
    alternatives: [versReco(reste[0]!), versReco(reste[1]!)],
  };
}
