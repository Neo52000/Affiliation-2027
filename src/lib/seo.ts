/**
 * Règles SEO de la section 9 : title < 60 caractères, meta description < 155,
 * uniques, générés par gabarit puis vérifiés par script (Phase 8 : check-seo).
 */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** Compose un title « Page | Site ». Si le résultat dépasse TITLE_MAX, retourne la page seule. */
export function pageTitle(page: string, siteName: string): string {
  const full = `${page} | ${siteName}`;
  // Même borne que validateSeo et check-seo : strictement moins de TITLE_MAX.
  return full.length < TITLE_MAX ? full : page;
}

/** Retourne la liste des violations des longueurs imposées (vide = conforme). */
export function validateMeta(title: string, description: string): string[] {
  const violations: string[] = [];
  if (title.trim().length === 0) violations.push('title vide');
  if (title.length >= TITLE_MAX) {
    violations.push(`title ${title.length} caractères (max ${TITLE_MAX - 1}) : « ${title} »`);
  }
  if (description.trim().length === 0) violations.push('description vide');
  if (description.length >= DESCRIPTION_MAX) {
    violations.push(`description ${description.length} caractères (max ${DESCRIPTION_MAX - 1})`);
  }
  return violations;
}

/** Title d'une page métier : la première variante qui respecte TITLE_MAX. */
export function metierTitle(nom: string): string {
  const variantes = [
    `Facturation électronique ${nom} : obligations et outils`,
    `${nom} : facturation électronique, le guide`,
    `Facturation électronique : ${nom}`,
  ];
  return variantes.find((v) => v.length < TITLE_MAX) ?? variantes[2]!.slice(0, TITLE_MAX - 1);
}

/**
 * Title d'un hub famille : la première variante qui respecte TITLE_MAX.
 * Les libellés composés sont réduits à leur tête (« Restauration et métiers de
 * bouche » → « Restauration ») ; la page garde le libellé complet en H1.
 */
export function familleTitle(label: string): string {
  const court = label.split(' et ')[0]!;
  const variantes = [
    `Facturation électronique : ${label.toLowerCase()}`,
    `Facturation électronique : ${court.toLowerCase()}`,
    `${court} : facturation électronique`,
  ];
  return variantes.find((v) => v.length < TITLE_MAX) ?? variantes[1]!.slice(0, TITLE_MAX - 1);
}

/** Meta description d'une page métier (< DESCRIPTION_MAX, unique par métier). */
export function metierDescription(nom: string): string {
  const d = `Facturation électronique pour ${nom} : obligations, spécificités du métier, exemple de facture conforme et logiciels adaptés. Données datées et sourcées.`;
  return d.length < DESCRIPTION_MAX
    ? d
    : `Facturation électronique pour ${nom} : obligations, exemple de facture et logiciels adaptés.`;
}

/** URL canonique absolue, sans slash final (sauf racine), sans query string. */
export function canonicalUrl(site: string, pathname: string): string {
  const base = site.replace(/\/+$/, '');
  let path = pathname.split('?')[0] ?? '';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
  return path === '/' ? `${base}/` : `${base}${path}`;
}

/**
 * JSON-LD sûr pour `set:html` : JSON.stringify n'échappe pas « < », si bien
 * qu'une donnée contenant « </script> » fermerait le bloc et ferait naître un
 * script (que la CSP par empreintes autoriserait, puisqu'elle est calculée sur
 * le site construit). On échappe donc <, >, & et les séparateurs U+2028/U+2029.
 */
export function jsonLdSur(valeur: unknown): string {
  return JSON.stringify(valeur)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
