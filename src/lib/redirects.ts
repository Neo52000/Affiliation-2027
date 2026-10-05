/**
 * Génération des redirections 302 /go/{slug} de netlify.toml à partir
 * d'affiliation.json (section 8 de la spécification). Seules les entrées
 * non nulles produisent une redirection ; les autres outils basculent vers
 * leur URL officielle directement dans AffiliateButton.
 */

export const MARQUEUR_DEBUT =
  '# --- debut:redirections-go (genere par scripts/generate-redirects.ts) ---';
export const MARQUEUR_FIN = '# --- fin:redirections-go ---';

export function blocRedirections(liens: Record<string, string | null>): string {
  const actifs = Object.entries(liens)
    .filter((e): e is [string, string] => e[1] !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  const regles = actifs.map(
    ([slug, url]) => `[[redirects]]
  from = "/go/${slug}"
  to = "${url}"
  status = 302
  force = true`,
  );

  return [
    MARQUEUR_DEBUT,
    ...(regles.length > 0 ? regles : ['# (aucun lien affilié renseigné — voir TODO.md #6)']),
    MARQUEUR_FIN,
  ].join('\n\n');
}

/** Remplace (ou ajoute en fin de fichier) le bloc généré dans netlify.toml. */
export function injecterBloc(toml: string, bloc: string): string {
  const debut = toml.indexOf(MARQUEUR_DEBUT);
  const fin = toml.indexOf(MARQUEUR_FIN);
  if (debut !== -1 && fin !== -1) {
    return toml.slice(0, debut) + bloc + toml.slice(fin + MARQUEUR_FIN.length);
  }
  return `${toml.trimEnd()}\n\n${bloc}\n`;
}
