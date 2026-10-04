import affiliation from '../data/affiliation.json';

export interface AffiliateLink {
  /** URL du bouton : /go/{slug} si un lien affilié existe, sinon l'URL officielle */
  href: string;
  /** true = lien affilié (mention « lien affilié » + rel sponsored obligatoires, section 8) */
  sponsored: boolean;
}

const liens: Record<string, string | null> = affiliation.liens;

/**
 * Résout le lien d'un outil selon la règle de la section 8 :
 * URL affiliée présente -> /go/{slug} signalé « lien affilié » ;
 * absente -> URL officielle de l'éditeur, sans mention d'affiliation.
 */
export function affiliateLink(slug: string, urlOfficielle: string): AffiliateLink {
  const lien = liens[slug] ?? null;
  return lien === null
    ? { href: urlOfficielle, sponsored: false }
    : { href: `/go/${slug}`, sponsored: true };
}

/** Une page contenant au moins un lien affilié affiche le bandeau de transparence. */
export function hasAffiliate(slugs: string[]): boolean {
  return slugs.some((s) => (liens[s] ?? null) !== null);
}
