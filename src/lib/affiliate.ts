import donnees from '../data/affiliation.json';
import { liensActifs } from './liens-affilies';
import type { Affiliation } from './schemas';

export interface AffiliateLink {
  /** URL du bouton : /go/{slug} si un lien affilié actif existe, sinon l'URL officielle */
  href: string;
  /** true = lien affilié (mention « lien affilié » + rel sponsored obligatoires, section 8) */
  sponsored: boolean;
}

/**
 * Ce module part aussi dans l'îlot du quiz : il ne charge donc pas Zod (poids,
 * et CSP sans 'unsafe-eval'). Le fichier est validé par le schéma au postbuild
 * (scripts/generate-redirects.ts, qui fait échouer le build) et par les tests.
 */
const actifs = liensActifs(donnees as Affiliation);

/**
 * Résout le lien d'un outil selon la règle de la section 8 :
 * lien affilié actif -> /go/{slug} signalé « lien affilié » ;
 * sinon -> URL officielle de l'éditeur, sans mention d'affiliation.
 */
export function affiliateLink(slug: string, urlOfficielle: string): AffiliateLink {
  return Object.hasOwn(actifs, slug)
    ? { href: `/go/${slug}`, sponsored: true }
    : { href: urlOfficielle, sponsored: false };
}

/** Une page contenant au moins un lien affilié affiche le bandeau de transparence. */
export function hasAffiliate(slugs: string[]): boolean {
  return slugs.some((s) => Object.hasOwn(actifs, s));
}
