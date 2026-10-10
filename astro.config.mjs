// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { EDITEUR_IDENTIFIE, SITE } from './src/config.ts';

// `site` : domaine définitif non renseigné (TODO_DOMAINE, voir TODO.md).
// Placeholder requis dès maintenant pour générer canonical et sitemap.
export default defineConfig({
  site: 'https://todo-domaine.example',
  trailingSlash: 'never',
  build: {
    // 1 fichier HTML par route (ex. /logiciels/tiime.html servi sur /logiciels/tiime) :
    // URLs sans slash final cohérentes entre canonical, liens internes et Netlify.
    format: 'file',
  },
  // Îlots interactifs réservés aux 3 outils (section 4 de la spécification).
  // Sitemap segmenté (sitemap-index.xml) — section 9.
  // Le sitemap exclut les pages non indexées (contrôlé par scripts/check-seo.ts).
  // Polices auto-hébergées (CSP font-src 'self') : fichiers variables latins de
  // @fontsource-variable, déclarés par l'API Fonts d'Astro, qui génère aussi des
  // polices de repli ajustées (size-adjust) pour un CLS nul. Pas d'italique.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Newsreader',
      cssVariable: '--font-newsreader',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            src: [
              './node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2',
            ],
            weight: '200 800',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans',
      cssVariable: '--font-instrument',
      fallbacks: ['system-ui'],
      options: {
        variants: [
          {
            src: [
              './node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2',
            ],
            weight: '400 700',
            style: 'normal',
          },
        ],
      },
    },
  ],
  integrations: [
    preact(),
    mdx(),
    sitemap({
      filter: (page) =>
        !/\/(admin|newsletter\/[a-z-]+)$/.test(page) &&
        // Mêmes conditions que le noindex de ces pages (placeholders non renseignés).
        (EDITEUR_IDENTIFIE || !page.endsWith('/mentions-legales')) &&
        (!SITE.name.startsWith('TODO_') || !page.endsWith('/a-propos')),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
