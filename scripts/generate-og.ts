/**
 * Génère public/og.png (1200 × 630), l'image de partage du site, depuis un
 * gabarit HTML local : couleurs lues dans src/styles/global.css, polices du
 * site embarquées. L'image ne porte ni chiffre, ni date, ni nom de site : rien
 * à tenir à jour, rien d'inventé. À relancer seulement si la palette, les
 * polices ou le texte changent.
 * Usage : pnpm og (PW_CHROMIUM=/chemin/chrome pour un Chromium déjà installé).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
const jeton = (nom: string): string => {
  const valeur = css.match(new RegExp(`--color-${nom}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!valeur) throw new Error(`generate-og : jeton --color-${nom} introuvable dans global.css`);
  return valeur;
};
const police = (paquet: string, fichier: string) =>
  `data:font/woff2;base64,${readFileSync(join(ROOT, 'node_modules/@fontsource-variable', paquet, 'files', fichier)).toString('base64')}`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>
@font-face { font-family: Newsreader; font-weight: 200 800; src: url(${police('newsreader', 'newsreader-latin-wght-normal.woff2')}) format('woff2'); }
@font-face { font-family: 'Instrument Sans'; font-weight: 400 700; src: url(${police('instrument-sans', 'instrument-sans-latin-wght-normal.woff2')}) format('woff2'); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: ${jeton('paper')}; color: ${jeton('ink')};
  font-family: 'Instrument Sans', sans-serif; padding: 72px 88px; display: flex; flex-direction: column; }
.surtitre { font-size: 26px; font-weight: 600; color: ${jeton('accent')}; padding-bottom: 22px; border-bottom: 2px solid ${jeton('ink')}; }
h1 { font-family: Newsreader, serif; font-weight: 500; font-size: 84px; line-height: 1.04; letter-spacing: -0.015em; margin-top: 40px; max-width: 980px; text-wrap: balance; }
p { font-size: 31px; line-height: 1.4; color: ${jeton('ink-soft')}; margin-top: 30px; max-width: 900px; }
.filets { margin-top: auto; display: grid; gap: 9px; }
.filets span { display: block; height: 1px; background: ${jeton('border')}; }
.filets span:first-child { height: 4px; width: 120px; background: ${jeton('accent')}; }
</style></head><body>
<div class="surtitre">Facturation électronique</div>
<h1>Le bon logiciel pour votre métier.</h1>
<p>Échéances, mentions obligatoires et logiciels adaptés, avec leurs sources officielles.</p>
<div class="filets" aria-hidden="true"><span></span><span></span><span></span></div>
</body></html>`;

const navigateur = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const page = await navigateur.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
const charges = await page.evaluate(() =>
  ['Newsreader', 'Instrument Sans'].every((f) => document.fonts.check(`16px "${f}"`)),
);
if (!charges) throw new Error('generate-og : polices non chargées');
await page.screenshot({ path: join(ROOT, 'public/og.png') });
await navigateur.close();
console.log('generate-og : public/og.png régénérée (1200 × 630).');
