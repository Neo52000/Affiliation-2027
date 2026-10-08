/**
 * Préférence « animations en pause » (WCAG 2.2.2, Pause, Stop, Hide).
 *
 * Les boucles du site ne tournent que sous `html.anim-on`, posée par le script
 * de tête de Base.astro : sans JavaScript, rien ne boucle. Le bouton de l'en-tête
 * bascule vers `html.anim-pause` et mémorise ce choix dans le navigateur.
 */
export const CLE_ANIMATIONS = 'animations';
export const VALEUR_PAUSE = 'pause';

export type EtatAnimations = 'on' | 'pause';

/** État au chargement, d'après la valeur stockée (absente ou illisible = animations actives). */
export function etatInitial(stockee: string | null): EtatAnimations {
  return stockee === VALEUR_PAUSE ? 'pause' : 'on';
}

export function basculer(etat: EtatAnimations): EtatAnimations {
  return etat === 'on' ? 'pause' : 'on';
}

/** Classe posée sur <html> pour un état donné. */
export function classeHtml(etat: EtatAnimations): 'anim-on' | 'anim-pause' {
  return etat === 'on' ? 'anim-on' : 'anim-pause';
}
