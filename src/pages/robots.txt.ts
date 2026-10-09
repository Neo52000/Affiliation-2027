import type { APIRoute } from 'astro';

/**
 * robots.txt généré au build : l'adresse du sitemap suit le domaine configuré
 * (`site` dans astro.config.mjs), sans copie à tenir à jour. Les redirections
 * /go/ (liens affiliés) restent hors exploration.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /go/',
      '',
      `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
      '',
    ].join('\n'),
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
