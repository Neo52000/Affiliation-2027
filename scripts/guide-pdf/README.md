# Guide PDF offert à l'inscription

Source du fichier `public/telechargement/guide-facturation-electronique-2026-2027.pdf`,
proposé sur les pages de confirmation du double opt-in (`/newsletter/confirmee` et
`/newsletter/rappel-confirme`). Valeurs affichées sur le site : `GUIDE_OFFERT` dans
`src/config.ts`.

## Régénérer

Prérequis : Python 3, `reportlab`, `fonttools`, `poppler-utils` (pour la couverture),
police Inter installée (`/usr/share/fonts/opentype/inter/`).

```sh
cd scripts/guide-pdf
# 1. Inter en TrueType (reportlab ne lit pas les contours PostScript des .otf)
python3 otf2ttf.py Inter-Regular Inter-Medium Inter-SemiBold Inter-Bold Inter-Italic InterDisplay-Bold InterDisplay-Black
# 2. Le guide
python3 build_guide.py ../../public/telechargement/guide-facturation-electronique-2026-2027.pdf
# 3. Couverture (1x = 240 px, 2x = 480 px de large)
pdftoppm -r 110 -png -f 1 -l 1 -singlefile ../../public/telechargement/guide-facturation-electronique-2026-2027.pdf couverture
```

Puis convertir `couverture.png` en `guide-couverture-1x.webp` et `-2x.webp` dans
`public/telechargement/`. Le dossier `fonts/` et les PNG intermédiaires ne sont pas versionnés.

## Nouvelle édition

1. Mettre à jour le contenu daté de `build_guide.py` (`EDITION`, `MAJ`, chiffres, sources),
   en vérifiant chaque fait sur impots.gouv.fr, economie.gouv.fr et Légifrance.
2. Changer le nom du fichier (année ou mois) : l'en-tête `Cache-Control` de
   `/telechargement/*` dure une journée.
3. Mettre à jour `GUIDE_OFFERT` (`fichier`, `pages`, `poidsKo`, `edition`).
4. Annoncer la nouvelle édition dans la newsletter (finalité prévue par le consentement).
