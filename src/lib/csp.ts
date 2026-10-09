/**
 * Politique de sécurité du contenu (CSP) du site statique.
 *
 * Astro place en ligne de petits scripts : amorce des îlots, directives
 * client:*, scripts de composants. Une CSP `script-src 'self'` les bloque tous,
 * et les îlots ne s'hydratent plus. La politique autorise donc chaque script en
 * ligne par son empreinte sha256, calculée sur le site construit
 * (scripts/generate-csp.ts), et rien d'autre.
 */
import { createHash } from 'node:crypto';

/** Types de <script> que le navigateur exécute (les blocs de données, comme JSON-LD, ne le sont pas). */
const TYPES_EXECUTABLES = new Set(['', 'module', 'text/javascript', 'application/javascript']);

/** Contenus exacts des scripts en ligne exécutables d'une page HTML. */
export function scriptsEnLigne(html: string): string[] {
  const contenus: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributs = m[1] ?? '';
    const contenu = m[2] ?? '';
    if (/\bsrc\s*=/i.test(attributs)) continue;
    const type = (attributs.match(/\btype\s*=\s*["']?([^"'\s>]*)/i)?.[1] ?? '').toLowerCase();
    if (!TYPES_EXECUTABLES.has(type)) continue;
    if (contenu.trim() === '') continue;
    contenus.push(contenu);
  }
  return contenus;
}

/** Source CSP d'un script : 'sha256-…' calculé sur ses octets UTF-8 exacts. */
export function empreinte(contenu: string): string {
  return `'sha256-${createHash('sha256').update(contenu, 'utf8').digest('base64')}'`;
}

/** Politique complète ; les empreintes sont triées pour un résultat stable d'un build à l'autre. */
export function politique(empreintes: Iterable<string>): string {
  const triees = [...new Set(empreintes)].sort();
  return [
    "default-src 'self'",
    "img-src 'self' data:",
    // Astro place aussi de petites feuilles de style en ligne.
    "style-src 'self' 'unsafe-inline'",
    ['script-src', "'self'", ...triees].join(' '),
    "font-src 'self'",
    // Le back office joint GitHub par son relais same-origin (/admin/gh/*).
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/** Fichier `_headers` Netlify : la CSP s'applique à toutes les pages. */
export function fichierHeaders(csp: string): string {
  return `# Généré par scripts/generate-csp.ts : ne pas éditer à la main.\n/*\n  Content-Security-Policy: ${csp}\n`;
}

/** Empreintes autorisées par un fichier `_headers` (vide si aucune CSP). */
export function empreintesAutorisees(headers: string): Set<string> {
  const ligne = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? '';
  const scriptSrc = ligne.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
  return new Set(scriptSrc.match(/'sha256-[A-Za-z0-9+/=]+'/g) ?? []);
}
