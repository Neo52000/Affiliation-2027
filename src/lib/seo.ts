/**
 * Règles SEO de la section 9 : title < 60 caractères, meta description < 155,
 * uniques, générés par gabarit puis vérifiés par script (Phase 8 : check-seo).
 */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** Compose un title « Page | Site ». Si le résultat dépasse TITLE_MAX, retourne la page seule. */
export function pageTitle(page: string, siteName: string): string {
  const full = `${page} | ${siteName}`;
  return full.length <= TITLE_MAX ? full : page;
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

/** URL canonique absolue, sans slash final (sauf racine), sans query string. */
export function canonicalUrl(site: string, pathname: string): string {
  const base = site.replace(/\/+$/, '');
  let path = pathname.split('?')[0] ?? '';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
  return path === '/' ? `${base}/` : `${base}${path}`;
}
