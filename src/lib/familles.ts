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
