/**
 * Régénère le bloc de redirections /go/ de netlify.toml depuis
 * src/data/affiliation.json (lancé par le prebuild — local, CI et Netlify).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { blocRedirections, injecterBloc } from '../src/lib/redirects.ts';

const racine = process.cwd();
const cheminToml = join(racine, 'netlify.toml');
const affiliation = JSON.parse(readFileSync(join(racine, 'src/data/affiliation.json'), 'utf8')) as {
  liens: Record<string, string | null>;
};

const avant = readFileSync(cheminToml, 'utf8');
const apres = injecterBloc(avant, blocRedirections(affiliation.liens));

if (apres !== avant) {
  writeFileSync(cheminToml, apres);
  console.log('generate-redirects : netlify.toml mis à jour.');
} else {
  console.log('generate-redirects : netlify.toml déjà à jour.');
}
const actifs = Object.values(affiliation.liens).filter((v) => v !== null).length;
console.log(`generate-redirects : ${actifs} redirection(s) /go/ active(s).`);
