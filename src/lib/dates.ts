const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** "2026-09-01" -> "1er septembre 2026" (sans objet Date : pas de fuseau en jeu). */
export function formatDateFr(iso: string): string {
  const [annee, mois, jour] = iso.split('-').map(Number);
  if (!annee || !mois || !jour || mois < 1 || mois > 12) {
    throw new Error(`date invalide : ${iso}`);
  }
  const j = jour === 1 ? '1er' : String(jour);
  return `${j} ${MOIS[mois - 1]} ${annee}`;
}
