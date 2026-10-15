/**
 * Comparatifs deux à deux des outils principaux.
 *
 * L'ordre fixe les URL (`/comparatif/tiime-vs-qonto`, jamais l'inverse) : il est
 * partagé par la page comparatif, les pages métier et les fiches outil pour
 * qu'aucun lien ne mène à une paire inexistante.
 */
export const ORDRE_COMPARATIFS = ['tiime', 'qonto', 'pennylane', 'abby', 'indy', 'shine'] as const;

const rang = (slug: string): number => {
  const i = (ORDRE_COMPARATIFS as readonly string[]).indexOf(slug);
  if (i === -1) throw new Error(`comparatifs : outil hors liste « ${slug} »`);
  return i;
};

/** Les deux slugs dans l'ordre de l'URL. */
export function paireOrdonnee(a: string, b: string): [string, string] {
  if (a === b) throw new Error(`comparatifs : paire d'un outil avec lui-même « ${a} »`);
  return rang(a) < rang(b) ? [a, b] : [b, a];
}

/** URL du comparatif de deux outils, quel que soit l'ordre des arguments. */
export function urlComparatif(a: string, b: string): string {
  const [x, y] = paireOrdonnee(a, b);
  return `/comparatif/${x}-vs-${y}`;
}

/** Toutes les paires publiées (C(6,2) = 15), dans l'ordre des URL. */
export function toutesLesPaires(): [string, string][] {
  return ORDRE_COMPARATIFS.flatMap((a, i) =>
    ORDRE_COMPARATIFS.slice(i + 1).map((b): [string, string] => [a, b]),
  );
}

/**
 * Verdict d'un profil pour une paire, sans jamais lire une donnée inconnue
 * (null) comme une absence : « à confirmer » n'est pas « non ».
 * `porte` : true = répond au besoin (vérifié), false = n'y répond pas, null = inconnu.
 */
export function verdictProfil(
  outils: [{ nom: string; porte: boolean | null }, { nom: string; porte: boolean | null }],
): string {
  const oui = outils.filter((o) => o.porte === true);
  const inconnus = outils.filter((o) => o.porte === null);
  const non = outils.filter((o) => o.porte === false);
  if (oui.length === 2) return 'Les deux répondent à ce besoin d’après leur périmètre vérifié.';
  if (oui.length === 1) {
    return inconnus.length === 1
      ? `${oui[0]!.nom}, d'après le périmètre vérifié ; pour ${inconnus[0]!.nom}, donnée à confirmer sur son site.`
      : `${oui[0]!.nom}, d'après le périmètre vérifié à ce jour.`;
  }
  if (inconnus.length === 2) {
    return 'Non confirmé pour l’un comme pour l’autre : vérifiez sur leurs sites avant de choisir.';
  }
  if (inconnus.length === 1) {
    return `${non[0]!.nom} n'y répond pas d'après son périmètre vérifié ; pour ${inconnus[0]!.nom}, donnée à confirmer sur son site.`;
  }
  return 'Aucun des deux ne répond à ce besoin d’après leur périmètre vérifié : comparez avec les autres logiciels.';
}
