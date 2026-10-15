/**
 * Tarifs et en-têtes des fiches logiciels (plan SEO du 2026-10-15) : rien n'est
 * calculé ni annoncé sans donnée relevée, datée et sourcée.
 */
import type { Outil } from './schemas.ts';

type Plan = Outil['plans'][number];

/** Coût sur 12 mois d'une offre relevée, dans sa base (HT ou TTC) ; null si non relevé. */
export function coutDouzeMois(plan: Plan): { montant: number; base: Plan['base'] } | null {
  if (plan.montant === null || plan.date_releve === null || plan.url_source === null) return null;
  const montant = plan.periodicite === 'mois' ? plan.montant * 12 : plan.montant;
  return { montant: Math.round(montant * 100) / 100, base: plan.base };
}

/** Offre relevée la moins chère sur 12 mois, à base égale (HT d'abord), ou null. */
export function prixEntreeDouzeMois(
  plans: Plan[],
): { nom: string; montant: number; base: Plan['base'] } | null {
  const couts = plans
    .map((p) => ({ nom: p.nom, cout: coutDouzeMois(p) }))
    .filter(
      (c): c is { nom: string; cout: NonNullable<ReturnType<typeof coutDouzeMois>> } =>
        c.cout !== null,
    );
  for (const base of ['HT', 'TTC'] as const) {
    const meme = couts
      .filter((c) => c.cout.base === base)
      .sort((a, b) => a.cout.montant - b.cout.montant);
    if (meme[0]) return { nom: meme[0].nom, montant: meme[0].cout.montant, base };
  }
  return null;
}

/**
 * Title, H1 et description d'une fiche logiciel : « tarifs » et « limites »
 * n'apparaissent que si la page les publie (offre relevée, points faibles).
 */
export function enteteLogiciel(nom: string, avecTarifs: boolean, avecLimites: boolean) {
  const objet = avecTarifs
    ? avecLimites
      ? 'avis, tarifs et limites'
      : 'avis, tarifs et fonctions'
    : avecLimites
      ? 'avis, fonctions et limites'
      : 'avis et fonctions vérifiées';
  const question = avecTarifs
    ? avecLimites
      ? 'pour qui, à quel prix et avec quelles limites ?'
      : 'pour qui et à quel prix ?'
    : avecLimites
      ? 'pour qui et avec quelles limites ?'
      : 'pour qui et avec quelles fonctions ?';
  const contenu = [
    avecTarifs ? 'tarifs datés' : null,
    'fonctions vérifiées',
    avecLimites ? 'limites' : null,
    'statut de plateforme agréée',
  ].filter(Boolean);
  return {
    titre: `${nom} : ${objet}`,
    h1: `${nom} : ${question}`,
    description: `${nom} pour la facturation électronique : ${contenu.slice(0, -1).join(', ')} et ${contenu.at(-1)}. Données sourcées et alternatives.`,
  };
}
