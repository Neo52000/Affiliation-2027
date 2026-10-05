/**
 * Contrôle mensuel des liens (MAINTENANCE.md) : teste toutes les URL sources
 * des données et contenus, et les URL affiliées. À lancer depuis un réseau
 * sans proxy bloquant : node --experimental-strip-types scripts/check-links.ts
 * Échoue (exit 1) si au moins un lien est cassé.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const racine = process.cwd();
const urls = new Map<string, string[]>(); // url -> provenances

function ajouter(url: unknown, provenance: string) {
  if (typeof url !== 'string' || !url.startsWith('http')) return;
  const liste = urls.get(url) ?? [];
  liste.push(provenance);
  urls.set(url, liste);
}

function collecter(valeur: unknown, provenance: string) {
  if (typeof valeur === 'string') {
    if (valeur.startsWith('http')) ajouter(valeur, provenance);
  } else if (Array.isArray(valeur)) {
    for (const v of valeur) collecter(v, provenance);
  } else if (typeof valeur === 'object' && valeur !== null) {
    for (const [cle, v] of Object.entries(valeur)) {
      if (/url|source|site|lien/i.test(cle) || typeof v === 'object') collecter(v, provenance);
    }
  }
}

for (const fichier of readdirSync(join(racine, 'src/data'))) {
  if (!fichier.endsWith('.json')) continue;
  collecter(JSON.parse(readFileSync(join(racine, 'src/data', fichier), 'utf8')), `data/${fichier}`);
}
for (const dossier of ['outils', 'metiers', 'tests']) {
  const chemin = join(racine, 'src/content', dossier);
  for (const fichier of readdirSync(chemin)) {
    if (!fichier.endsWith('.json')) continue;
    collecter(
      JSON.parse(readFileSync(join(chemin, fichier), 'utf8')),
      `content/${dossier}/${fichier}`,
    );
  }
}

console.log(`check-links : ${urls.size} URL uniques à tester.`);

const casses: string[] = [];
let testees = 0;

async function tester(url: string): Promise<void> {
  const essayer = async (methode: 'HEAD' | 'GET') => {
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), 15_000);
    try {
      return await fetch(url, {
        method: methode,
        redirect: 'follow',
        signal: controleur.signal,
        headers: { 'user-agent': 'check-links (routine de maintenance du site)' },
      });
    } finally {
      clearTimeout(minuteur);
    }
  };
  try {
    let reponse = await essayer('HEAD');
    if (reponse.status === 405 || reponse.status === 403) reponse = await essayer('GET');
    if (reponse.status >= 400) {
      casses.push(`${url} -> HTTP ${reponse.status} (${urls.get(url)!.slice(0, 2).join(', ')})`);
    }
  } catch (e) {
    casses.push(`${url} -> ${e instanceof Error ? e.message : 'erreur'} (${urls.get(url)![0]})`);
  }
  testees++;
  if (testees % 25 === 0) console.log(`  ${testees}/${urls.size}…`);
}

// 8 requêtes en parallèle, pas plus : politesse envers les sites officiels.
const file = [...urls.keys()];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let url = file.shift(); url; url = file.shift()) await tester(url);
  }),
);

if (casses.length > 0) {
  console.error(`\nÉCHEC : ${casses.length} lien(s) cassé(s) :`);
  for (const c of casses.sort()) console.error(`  - ${c}`);
  process.exit(1);
}
console.log('OK : tous les liens répondent.');
