import type { Affiliation } from './schemas.ts';

/** Liens affiliés réellement publiés : URL renseignée ET lien actif. */
export function liensActifs(data: Affiliation): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data.liens)
      .filter(([, l]) => l.actif && l.url !== null)
      .map(([slug, l]) => [slug, l.url as string]),
  );
}
