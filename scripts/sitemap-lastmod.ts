/**
 * lastmod du sitemap (postbuild) : pour chaque <loc> des sitemap-N.xml produits
 * par @astrojs/sitemap, date « Mis à jour le » de la page (balise og:updated_time,
 * posée depuis date_maj) ou, à défaut, date du build.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const dateBuild = new Date().toISOString().slice(0, 10);

/** Fichier HTML servi pour une URL du sitemap (build.format 'file'). */
function fichierDe(loc: string): string {
  const chemin = decodeURIComponent(new URL(loc).pathname);
  return join(DIST, chemin === '/' ? 'index.html' : `${chemin.replace(/\/$/, '')}.html`);
}

let datees = 0;
let total = 0;
for (const sitemap of readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f))) {
  const chemin = join(DIST, sitemap);
  const xml = readFileSync(chemin, 'utf8').replace(
    /<url><loc>([^<]+)<\/loc>(?:<lastmod>[^<]*<\/lastmod>)?/g,
    (_, loc: string) => {
      total++;
      const fichier = fichierDe(loc);
      if (!existsSync(fichier)) throw new Error(`sitemap-lastmod : ${loc} sans fichier ${fichier}`);
      const maj = /<meta property="og:updated_time" content="(\d{4}-\d{2}-\d{2})/.exec(
        readFileSync(fichier, 'utf8'),
      )?.[1];
      if (maj) datees++;
      return `<url><loc>${loc}</loc><lastmod>${maj ?? dateBuild}</lastmod>`;
    },
  );
  writeFileSync(chemin, xml);
}
console.log(
  `sitemap-lastmod : ${total} URL, ${datees} datées par « Mis à jour le », ${total - datees} à la date du build.`,
);
