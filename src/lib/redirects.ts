/**
 * Redirections 302 /go/{slug} des liens affiliés (section 8 de la
 * spécification), écrites dans dist/_redirects après le build : Netlify lit ce
 * fichier à chaque déploiement, et le dépôt n'est plus modifié pendant le build.
 * Seuls les liens actifs produisent une règle ; les autres outils pointent
 * directement vers leur URL officielle (AffiliateButton).
 */
import { estUrlSure } from './url-sure.ts';

export const ENTETE_REDIRECTIONS =
  '# Généré par scripts/generate-redirects.ts depuis src/data/affiliation.json : ne pas éditer.';

export function fichierRedirections(actifs: Record<string, string>): string {
  const lignes = Object.entries(actifs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, url]) => {
      // Double sécurité : le schéma a déjà refusé toute URL capable de casser la ligne.
      if (!/^[a-z0-9-]+$/.test(slug) || !estUrlSure(url)) {
        throw new Error(`redirection /go/${slug} refusée : URL ou slug invalide`);
      }
      return `/go/${slug}  ${url}  302!`;
    });
  return [
    ENTETE_REDIRECTIONS,
    ...(lignes.length > 0 ? lignes : ['# Aucun lien affilié actif.']),
    '',
  ].join('\n');
}

/** Slugs couverts par une règle /go/ d'un fichier _redirects. */
export function slugsRediriges(fichier: string): Set<string> {
  return new Set(
    [...fichier.matchAll(/^\/go\/([a-z0-9-]+)\s+https:\/\/\S+\s+302!?\s*$/gm)].map((m) => m[1]!),
  );
}
