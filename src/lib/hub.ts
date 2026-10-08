/**
 * Outils retenus dans une famille de métiers : combien de fiches métier de la
 * famille citent chaque outil parmi leurs trois outils adaptés.
 *
 * Tous les outils cités sont rendus, sans troncature : quatre familles ont des
 * ex æquo au seuil d'un « top 3 », et couper la liste aurait tranché au hasard.
 * Tri : nombre de fiches décroissant, puis ordre alphabétique (même règle de
 * départage que le quiz). Les commissions n'entrent jamais dans le calcul.
 */
export interface OutilRetenu {
  slug: string;
  nom: string;
  /** Nombre de fiches métier de la famille qui citent l'outil. */
  fiches: number;
}

export function outilsRetenus(
  metiers: readonly { outils_recommandes: readonly { slug: string }[] }[],
  noms: Readonly<Record<string, string>>,
): OutilRetenu[] {
  const comptes = new Map<string, number>();
  for (const m of metiers) {
    for (const slug of new Set(m.outils_recommandes.map((o) => o.slug))) {
      comptes.set(slug, (comptes.get(slug) ?? 0) + 1);
    }
  }
  return [...comptes]
    .map(([slug, fiches]) => {
      const nom = noms[slug];
      if (!nom) throw new Error(`hub : outil recommandé sans fiche « ${slug} »`);
      return { slug, nom, fiches };
    })
    .sort((a, b) => b.fiches - a.fiches || a.nom.localeCompare(b.nom, 'fr'));
}
