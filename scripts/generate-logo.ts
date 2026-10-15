/**
 * Déclinaisons du logo depuis src/assets/logo/source.png (fichier fourni par
 * l'éditeur, fond transparent) :
 * - src/assets/logo/logo-clair.png : logo recadré sur son contenu (image de partage) ;
 * - public/logo/logo-{clair,sombre}-{1x,2x}.webp : en-tête, à 34 px de haut et en
 *   double densité ; la variante sombre recolore le texte quasi noir en encre
 *   claire et les verts en accent clair (jetons de global.css) ;
 * - src/assets/logo/dimensions.json : largeur et hauteur d'affichage de l'en-tête ;
 * - public/favicon-32.png, public/favicon-192.png : icône seule, fond transparent ;
 * - public/apple-touch-icon.png (180 px) : icône sur fond papier, iOS n'acceptant
 *   pas la transparence.
 * Traitement dans un canvas Chromium (Playwright, déjà en devDependency) : le site
 * n'embarque pas sharp, l'optimisation d'images d'Astro n'est donc pas utilisée.
 * À relancer seulement si le logo ou la palette changent.
 * Usage : pnpm logo (PW_CHROMIUM=/chemin/chrome pour un Chromium déjà installé).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
const sombre = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
const jeton = (source: string, nom: string): string => {
  const valeur = source.match(new RegExp(`--color-${nom}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!valeur) throw new Error(`generate-logo : jeton --color-${nom} introuvable`);
  return valeur;
};
const couleurs = {
  papier: jeton(css, 'paper'),
  encreSombre: jeton(sombre, 'ink'),
  accentSombre: jeton(sombre, 'accent'),
  accentSombreFort: jeton(sombre, 'accent-strong'),
};
const source = `data:image/png;base64,${readFileSync(join(ROOT, 'src/assets/logo/source.png')).toString('base64')}`;

const navigateur = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const page = await navigateur.newPage();
const HAUTEUR_ENTETE = 34;
const sorties = await page.evaluate(
  async ({ source, couleurs, hauteurEntete }) => {
    const img = new Image();
    img.src = source;
    await img.decode();
    const toile = (l: number, h: number) => {
      const c = document.createElement('canvas');
      c.width = l;
      c.height = h;
      return [c, c.getContext('2d')!] as const;
    };
    const [, ctx0] = toile(img.width, img.height);
    ctx0.drawImage(img, 0, 0);
    const donnees = ctx0.getImageData(0, 0, img.width, img.height);
    const px = donnees.data;
    const opaque = (x: number, y: number) => px[(y * img.width + x) * 4 + 3]! > 24;

    // Boîte englobante du contenu, et de l'icône (premier bloc de colonnes non vides).
    const colonnes = Array.from({ length: img.width }, (_, x) => {
      for (let y = 0; y < img.height; y++) if (opaque(x, y)) return true;
      return false;
    });
    const lignes = (x0: number, x1: number) => {
      let haut = img.height;
      let bas = 0;
      for (let y = 0; y < img.height; y++)
        for (let x = x0; x <= x1; x++)
          if (opaque(x, y)) {
            haut = Math.min(haut, y);
            bas = Math.max(bas, y);
          }
      return [haut, bas] as const;
    };
    const gauche = colonnes.indexOf(true);
    const droite = colonnes.lastIndexOf(true);
    let finIcone = gauche;
    while (colonnes.slice(finIcone + 1, finIcone + 13).some(Boolean)) finIcone++;
    const [haut, bas] = lignes(gauche, droite);
    const [hautIcone, basIcone] = lignes(gauche, finIcone);

    const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [encre, accent, accentFort] = [
      couleurs.encreSombre,
      couleurs.accentSombre,
      couleurs.accentSombreFort,
    ].map(hex) as [number[], number[], number[]];

    // Variante sombre : verts → accent clair (pli de page plus clair → accent fort),
    // quasi-noirs → encre claire. L'alpha (anticrénelage) est conservé.
    const sombreData = new ImageData(new Uint8ClampedArray(px), img.width, img.height);
    const s = sombreData.data;
    for (let i = 0; i < s.length; i += 4) {
      if (s[i + 3] === 0) continue;
      const [r, g, b] = [s[i]!, s[i + 1]!, s[i + 2]!];
      const vert = g - Math.max(r, b) > 12;
      const cible = vert ? ((r + g + b) / 3 > 110 ? accentFort : accent) : encre;
      s[i] = cible[0]!;
      s[i + 1] = cible[1]!;
      s[i + 2] = cible[2]!;
    }

    const recadre = (data: ImageData, x: number, y: number, l: number, h: number) => {
      const [c, ctx] = toile(l, h);
      ctx.putImageData(data, -x, -y, x, y, l, h);
      return c;
    };
    const png = (c: HTMLCanvasElement) => c.toDataURL('image/png');
    const marge = 4;
    const lLogo = droite - gauche + 1 + 2 * marge;
    const hLogo = bas - haut + 1 + 2 * marge;

    // Icône carrée, centrée.
    const lIcone = finIcone - gauche + 1;
    const hIcone = basIcone - hautIcone + 1;
    const cote = Math.max(lIcone, hIcone);
    const icone = recadre(donnees, gauche, hautIcone, lIcone, hIcone);
    const carre = (taille: number, fond: string | null, remplissage: number) => {
      const [c, ctx] = toile(taille, taille);
      if (fond) {
        ctx.fillStyle = fond;
        ctx.fillRect(0, 0, taille, taille);
      }
      const echelle = (taille * remplissage) / cote;
      const l = lIcone * echelle;
      const h = hIcone * echelle;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(icone, (taille - l) / 2, (taille - h) / 2, l, h);
      return png(c);
    };

    const logoClair = recadre(donnees, gauche - marge, haut - marge, lLogo, hLogo);
    const logoSombre = recadre(sombreData, gauche - marge, haut - marge, lLogo, hLogo);
    const largeurEntete = Math.round((lLogo / hLogo) * hauteurEntete);
    const reduit = (c: HTMLCanvasElement, densite: number) => {
      const [r, ctx] = toile(largeurEntete * densite, hauteurEntete * densite);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(c, 0, 0, r.width, r.height);
      return r.toDataURL('image/webp', 0.92);
    };

    return {
      clair: png(logoClair),
      entete: {
        'clair-1x': reduit(logoClair, 1),
        'clair-2x': reduit(logoClair, 2),
        'sombre-1x': reduit(logoSombre, 1),
        'sombre-2x': reduit(logoSombre, 2),
      },
      largeurEntete,
      favicon32: carre(32, null, 1),
      favicon192: carre(192, null, 1),
      apple: carre(180, couleurs.papier, 0.8),
      dimensions: `${lLogo}×${hLogo}`,
    };
  },
  { source, couleurs, hauteurEntete: HAUTEUR_ENTETE },
);
await navigateur.close();

const ecrire = (chemin: string, dataUrl: string) =>
  writeFileSync(join(ROOT, chemin), Buffer.from(dataUrl.split(',')[1]!, 'base64'));
ecrire('src/assets/logo/logo-clair.png', sorties.clair);
mkdirSync(join(ROOT, 'public/logo'), { recursive: true });
for (const [nom, dataUrl] of Object.entries(sorties.entete)) {
  ecrire(`public/logo/logo-${nom}.webp`, dataUrl);
}
writeFileSync(
  join(ROOT, 'src/assets/logo/dimensions.json'),
  `${JSON.stringify({ largeur: sorties.largeurEntete, hauteur: HAUTEUR_ENTETE })}\n`,
);
ecrire('public/favicon-32.png', sorties.favicon32);
ecrire('public/favicon-192.png', sorties.favicon192);
ecrire('public/apple-touch-icon.png', sorties.apple);
console.log(
  `generate-logo : logo ${sorties.dimensions}, en-tête clair et sombre (1x, 2x), 3 icônes.`,
);
