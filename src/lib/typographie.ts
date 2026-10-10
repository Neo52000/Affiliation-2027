/**
 * Petites règles de typographie française partagées par les gabarits et les
 * îlots (aucune dépendance : importable côté navigateur).
 */

/**
 * Préposition « de » élidée devant une voyelle : « d’Abby », « de Tiime ».
 * Le h n'est pas élidé (h aspiré possible) : aucun nom concerné aujourd'hui.
 */
export function de(nom: string): string {
  return /^[aeiouàâäéèêëîïôöùûü]/i.test(nom) ? `d’${nom}` : `de ${nom}`;
}

/**
 * « 1 mention obligatoire manquante », « 3 mentions obligatoires manquantes » :
 * le nombre suivi d'un groupe nominal accordé. Règle simple (ajout d'un s aux
 * mots qui n'en ont pas), suffisante pour les groupes réguliers du site.
 */
export function pluriel(n: number, groupe: string): string {
  if (n <= 1) return `${n} ${groupe}`;
  return `${n} ${groupe
    .split(' ')
    .map((mot) => (/[sxz]$/.test(mot) ? mot : `${mot}s`))
    .join(' ')}`;
}

/**
 * Espace insécable avant : ; ? ! » et après « (typographie française). Le
 * postbuild l'applique au HTML ; les îlots l'appliquent à leurs textes dynamiques,
 * pour que l'hydratation n'y remette pas d'espaces ordinaires.
 */
export function typographier(texte: string): string {
  return texte.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}
