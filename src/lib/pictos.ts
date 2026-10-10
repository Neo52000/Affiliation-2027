/**
 * Tracés des pictogrammes (trait 1.8, currentColor) de la présentation
 * partenaires, générée hors Astro par scripts/build-presentation.ts. Le site
 * lui-même n'affiche plus de pictogrammes depuis le design v7.
 */
export type NomPicto =
  | 'batiment'
  | 'sante'
  | 'commerce'
  | 'services'
  | 'liberal'
  | 'artisanat'
  | 'numerique'
  | 'transport'
  | 'restauration'
  | 'agriculture'
  | 'profil'
  | 'cible'
  | 'bouclier'
  | 'medaille'
  | 'document-source'
  | 'loupe'
  | 'calendrier'
  | 'facture';

/** Attributs du `<svg>` englobant, identiques partout où un picto est rendu. */
export const ATTRIBUTS_SVG_PICTO = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.8',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const;

export const TRACES: Record<NomPicto, string> = {
  batiment:
    '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>',
  sante: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  commerce:
    '<path d="M4.3 9 5.6 4.5h12.8L19.7 9"/><path d="M4.3 9a2.55 2.55 0 0 0 5.1 0 2.6 2.6 0 0 0 5.2 0 2.55 2.55 0 0 0 5.1 0"/><path d="M5.8 12.3v7.2h12.4v-7.2"/><path d="M9.8 19.5v-4.3h4.4v4.3"/>',
  services:
    '<rect x="4" y="7.5" width="16" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5"/><path d="M4 12h16"/>',
  liberal:
    '<path d="M12 4.5V20"/><path d="M8.5 20h7"/><path d="M5 7.5h14"/><path d="M7 7.5l-2.6 5.2a2.9 2.9 0 0 0 5.2 0L7 7.5Z"/><path d="M17 7.5l-2.6 5.2a2.9 2.9 0 0 0 5.2 0L17 7.5Z"/>',
  artisanat:
    '<path d="M14.8 6.3a4.2 4.2 0 0 0-5.6 5.2l-5 4.9a1.9 1.9 0 0 0 2.7 2.7l4.9-5a4.2 4.2 0 0 0 5.2-5.6l-2.7 2.7-2.2-2.2 2.7-2.7Z"/>',
  numerique: '<path d="m8 8-4.5 4L8 16"/><path d="m16 8 4.5 4L16 16"/><path d="m13.3 5-2.6 14"/>',
  transport:
    '<path d="M3 7.5h11v8H3z"/><path d="M14 10.5h3.5l3.5 3v2h-7"/><circle cx="7" cy="17" r="1.9"/><circle cx="16.8" cy="17" r="1.9"/>',
  restauration:
    '<path d="M8.5 20h7"/><path d="M7.5 17h9v-3.6a4.7 4.7 0 0 0 2.4-4.1A4.1 4.1 0 0 0 15 5.4a4.6 4.6 0 0 0-6 0 4.1 4.1 0 0 0-3.9 3.9 4.7 4.7 0 0 0 2.4 4.1V17Z"/>',
  agriculture:
    '<path d="M12 20v-7.5"/><path d="M12 12.5C12 8.9 9.4 6.5 6 6.5c0 3.6 2.6 6 6 6Z"/><path d="M12 10.8c0-3 2.1-5.1 5.6-5.1 0 3-2.1 5.1-5.6 5.1Z"/>',
  profil: '<circle cx="12" cy="8" r="3.6"/><path d="M5 19.5a7 7 0 0 1 14 0"/>',
  cible:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
  bouclier:
    '<path d="M12 3.5 19 6v5.4c0 4.7-3 7.7-7 9.1-4-1.4-7-4.4-7-9.1V6l7-2.5Z"/><path d="m8.9 11.6 2.3 2.3 4.4-4.5"/>',
  medaille: '<circle cx="12" cy="9" r="5.5"/><path d="m8.9 13.6-1.7 6.2 4.8-2.4 4.8 2.4-1.7-6.2"/>',
  'document-source':
    '<path d="M6 3.5h8l5 5V20.5H6z"/><path d="M14 3.5v5h5"/><path d="M9 13h6M9 16.5h6"/>',
  loupe: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  calendrier:
    '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10.2h16"/><path d="M8 3.5v4M16 3.5v4"/>',
  facture:
    '<path d="M6.5 3.5h11V20.5l-2.2-1.5-2.1 1.5-2.1-1.5-2.1 1.5-2.5-1.5Z"/><path d="M9.5 8h5M9.5 11.2h5M9.5 14.4h3"/>',
};
