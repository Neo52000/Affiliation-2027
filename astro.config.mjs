// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
  integrations: [preact(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
