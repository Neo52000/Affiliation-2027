/**
 * Postbuild : espaces insécables de la typographie française (avant : ; ? ! »,
 * après «) dans le texte de chaque page de dist/. Les gabarits et les contenus
 * gardent des espaces ordinaires ; scripts/check-redaction.ts vérifie le résultat.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { insererEspacesInsecables } from '../src/lib/redaction.ts';

const dist = join(process.cwd(), 'dist');
const pages = readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'));

let modifiees = 0;
for (const page of pages) {
  const chemin = join(dist, page);
  const html = readFileSync(chemin, 'utf8');
  const sortie = insererEspacesInsecables(html);
  if (sortie !== html) {
    writeFileSync(chemin, sortie);
    modifiees++;
  }
}
console.log(`typographie-dist : ${pages.length} pages, ${modifiees} mises à jour.`);
