import type { FAMILLES } from './schemas';

export type Famille = (typeof FAMILLES)[number];

/** Libellés d'affichage des 10 familles de métiers. */
export const FAMILLE_LABELS: Record<Famille, string> = {
  batiment: 'Bâtiment',
  sante: 'Santé',
  commerce: 'Commerce',
  services: 'Services',
  liberal: 'Professions libérales',
  artisanat: 'Artisanat',
  numerique: 'Numérique',
  transport: 'Transport',
  restauration: 'Restauration et métiers de bouche',
  agriculture: 'Agriculture',
};

/**
 * Formes grammaticales d'une famille, pour écrire « pour le bâtiment » ou
 * « propres à l’artisanat » sans fautes d'accord ni d'élision.
 * - `pour` : préposition et article, élidé s'il finit par une apostrophe ;
 * - `objet` : le nom de la famille tel qu'il suit l'article ;
 * - `a` : la forme contractée après « propres ».
 */
export const FAMILLE_FORMES: Record<Famille, { pour: string; objet: string; a: string }> = {
  batiment: { pour: 'pour le', objet: 'bâtiment', a: 'au bâtiment' },
  sante: { pour: 'pour la', objet: 'santé', a: 'à la santé' },
  commerce: { pour: 'pour le', objet: 'commerce', a: 'au commerce' },
  services: { pour: 'pour les', objet: 'services', a: 'aux services' },
  liberal: { pour: 'pour les', objet: 'professions libérales', a: 'aux professions libérales' },
  artisanat: { pour: 'pour l’', objet: 'artisanat', a: 'à l’artisanat' },
  numerique: { pour: 'pour le', objet: 'numérique', a: 'au numérique' },
  transport: { pour: 'pour le', objet: 'transport', a: 'au transport' },
  restauration: {
    pour: 'pour la',
    objet: 'restauration et les métiers de bouche',
    a: 'à la restauration et aux métiers de bouche',
  },
  agriculture: { pour: 'pour l’', objet: 'agriculture', a: 'à l’agriculture' },
};

/** true si l'article est élidé : aucun espace entre « l’ » et le nom. */
export function estElide(pour: string): boolean {
  return pour.endsWith('’');
}
