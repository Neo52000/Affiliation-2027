import type { APIRoute } from 'astro';
import { SITE } from '../config';

/**
 * robots.txt généré au build : l'adresse du sitemap suit le domaine configuré
 * (SITE.url dans src/config.ts), sans copie à tenir à jour. Les redirections
 * /go/ (liens affiliés) restent hors exploration.
 */
export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /go/',
      '',
      `Sitemap: ${new URL('/sitemap-index.xml', SITE.url).href}`,
      '',
    ].join('\n'),
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
