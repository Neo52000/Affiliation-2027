/**
 * Logique pure du quiz de recommandation (section 7 de la spécification).
 * Entrées : métier, statut, volume de factures, besoin de compte pro,
 * présence d'un expert-comptable, fonctions indispensables (facultatives).
 * La commission n'est JAMAIS une entrée.
 *
 * Règles (cahier des charges, section 6) :
 * 1. Les incompatibilités connues sont écartées avant le classement : une
 *    fonction indispensable vérifiée absente (false) exclut l'outil.
 * 2. Le score ne compte que des faits vérifiés (true) ; une donnée inconnue
 *    (null) ne rapporte rien, n'exclut pas, et devient un point « à confirmer ».
 * 3. Des ex æquo en tête ne sont pas départagés : le résultat les présente
 *    ensemble, avec les vérifications utiles.
 */

/** Fonctions qu'un visiteur peut déclarer indispensables. */
export type FonctionCle = 'devis' | 'acomptes' | 'app_mobile' | 'export_comptable';

export const LIBELLES_FONCTIONS: Record<FonctionCle, string> = {
  devis: 'les devis',
  acomptes: 'les factures d’acompte',
  app_mobile: 'une application mobile',
  export_comptable: 'l’export comptable',
};

export interface OutilFacts {
  slug: string;
  nom: string;
  /** Statut de plateforme agréée tel que publié sur la fiche (null = non confirmé). */
  plateformeAgreee: boolean | null;
  /** Faits vérifiés des fiches outil (null = non vérifié, ne compte pas) */
  comptePro: boolean | null;
  compta: boolean | null;
  lienExpertComptable: boolean | null;
  /** Fonctions déclarables indispensables ; absente = inconnue. */
  fonctions?: Partial<Record<FonctionCle, boolean | null>>;
  /** Cible revendiquée par l'éditeur, telle qu'affichée (comparaisons insensibles à la casse) */
  cibles: string[];
}

export interface QuizReponses {
  /** slug du métier si l'autocomplétion a reconnu la saisie, sinon null */
  metierSlug: string | null;
  statut: 'micro' | 'ei' | 'societe';
  facturesParMois: 'moins-10' | '10-50' | 'plus-50';
  besoinComptePro: boolean;
  expertComptable: boolean;
  indispensables?: FonctionCle[];
}

export interface Recommandation {
  slug: string;
  nom: string;
  justification: string;
  recommandeParMetier: boolean;
  /** Critères vérifiés qui ont compté dans le score. */
  raisons: string[];
  /** Besoins exprimés dont la donnée n'est pas encore vérifiée pour cet outil. */
  aConfirmer: string[];
}

export interface Exclusion {
  slug: string;
  nom: string;
  motif: string;
}

/**
 * Logiciel auquel la mesure attribue un quiz terminé : le recommandé, sinon
 * « aucun » (égalité en tête ou aucun logiciel compatible). Une égalité ne
 * désigne jamais de gagnant, pas même dans les statistiques.
 */
export function outilRetenu(r: Pick<QuizResultat, 'recommande' | 'exAequo'>): string {
  return r.recommande && r.exAequo.length < 2 ? r.recommande.slug : 'aucun';
}

export interface QuizResultat {
  /** Premier du classement ; null si aucun outil n'est compatible. */
  recommande: Recommandation | null;
  /** Jusqu'à deux alternatives, dans l'ordre du classement. */
  alternatives: Recommandation[];
  /** Outils à égalité en tête (2 ou plus) : aucun n'est mis en avant. Vide sinon. */
  exAequo: Recommandation[];
  /** Outils écartés par une incompatibilité vérifiée. */
  exclus: Exclusion[];
}

/** Normalise une saisie de métier : casse, accents, espaces et tirets. */
export function normaliserMetier(saisie: string): string {
  return saisie
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[-\s]+/g, ' ')
    .trim();
}

/** Slug du métier correspondant à la saisie (tolérant aux accents et à la casse), sinon null. */
export function trouverMetier(
  saisie: string,
  metiers: { nom: string; slug: string }[],
): string | null {
  const cle = normaliserMetier(saisie);
  if (!cle) return null;
  return metiers.find((m) => normaliserMetier(m.nom) === cle)?.slug ?? null;
}

function justifier(o: OutilFacts, r: QuizReponses, parMetier: boolean): string {
  const atouts: string[] = [];
  if (r.besoinComptePro && o.comptePro === true)
    atouts.push('propose aussi un compte professionnel');
  if (r.expertComptable && o.lienExpertComptable === true)
    atouts.push('est pensé pour travailler avec votre expert-comptable');
  else if (o.compta === true) atouts.push('intègre la comptabilité');
  const statut =
    o.plateformeAgreee === true
      ? `${o.nom} est une plateforme agréée`
      : `${o.nom} (statut de plateforme agréée à confirmer)`;
  const p1 =
    atouts.length > 0
      ? `${statut} qui ${atouts.slice(0, 2).join(' et ')}.`
      : o.plateformeAgreee === true
        ? `${statut} : émission, réception et e-reporting sans intermédiaire.`
        : `${statut} couvre l'émission et la réception des factures électroniques.`;
  const p2 = parMetier
    ? `C'est aussi l'un des logiciels recommandés sur la fiche de votre métier.`
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
  const indispensables = reponses.indispensables ?? [];

  const exclus: Exclusion[] = [];
  const compatibles = outils.filter((o) => {
    const absente = indispensables.find((f) => o.fonctions?.[f] === false);
    if (absente) {
      exclus.push({
        slug: o.slug,
        nom: o.nom,
        motif: `ne propose pas ${LIBELLES_FONCTIONS[absente]} (donnée vérifiée)`,
      });
    }
    return !absente;
  });

  const scores = compatibles.map((o) => {
    let score = 0;
    const raisons: string[] = [];
    const aConfirmer: string[] = [];

    const rangMetier = recosMetier.indexOf(o.slug);
    if (rangMetier >= 0) {
      score += [4, 3, 2][rangMetier] ?? 0;
      raisons.push('recommandé sur la fiche de votre métier');
    }
    if (reponses.besoinComptePro) {
      if (o.comptePro === true) {
        score += 3;
        raisons.push('compte professionnel intégré');
      } else if (o.comptePro === null) aConfirmer.push('compte professionnel intégré');
    }
    if (reponses.expertComptable) {
      if (o.lienExpertComptable === true) {
        score += 2;
        raisons.push('accès dédié pour l’expert-comptable');
      } else if (o.lienExpertComptable === null) aConfirmer.push('accès pour l’expert-comptable');
    }
    if (reponses.statut === 'micro' && o.cibles.some((c) => c.toLowerCase().includes('micro'))) {
      score += 2;
      raisons.push('cible les micro-entrepreneurs');
    }
    if (reponses.statut === 'societe' && o.cibles.some((c) => c.toLowerCase().includes('pme'))) {
      score += 2;
      raisons.push('cible les PME');
    }
    if (reponses.facturesParMois === 'plus-50') {
      if (o.compta === true) {
        score += 1;
        raisons.push('comptabilité intégrée, utile à ce volume');
      } else if (o.compta === null) aConfirmer.push('comptabilité intégrée');
    }
    for (const f of indispensables) {
      const v = o.fonctions?.[f];
      if (v === true) raisons.push(`${LIBELLES_FONCTIONS[f]} (vérifié)`);
      else if (v !== false) aConfirmer.push(LIBELLES_FONCTIONS[f]);
    }
    if (o.plateformeAgreee !== true) aConfirmer.push('statut de plateforme agréée');

    return { o, score, raisons, aConfirmer };
  });

  // L'ordre alphabétique ne sert qu'à afficher les ex æquo dans un ordre stable :
  // il ne désigne jamais un gagnant (exAequo).
  const tries = scores.sort((a, b) => b.score - a.score || a.o.nom.localeCompare(b.o.nom, 'fr'));

  const versReco = (s: (typeof tries)[number]): Recommandation => ({
    slug: s.o.slug,
    nom: s.o.nom,
    justification: justifier(s.o, reponses, recosMetier.includes(s.o.slug)),
    recommandeParMetier: recosMetier.includes(s.o.slug),
    raisons: s.raisons,
    aConfirmer: s.aConfirmer,
  });

  const [premier, ...reste] = tries;
  const exAequo = premier ? tries.filter((s) => s.score === premier.score) : [];

  return {
    recommande: premier ? versReco(premier) : null,
    alternatives: reste.slice(0, 2).map(versReco),
    exAequo: exAequo.length > 1 ? exAequo.map(versReco) : [],
    exclus,
  };
}
