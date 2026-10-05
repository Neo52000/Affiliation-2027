// @ts-check
import { defineConfig } from 'astro/config';
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
  vite: {
    plugins: [tailwindcss()],
  },
});
