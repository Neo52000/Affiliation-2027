# MAINTENANCE — routine mensuelle

Le site vend de la confiance : des données datées, sourcées, à jour. Cette routine
prend 2 à 3 heures par mois. Chaque étape indique le fichier à modifier ; tout
passe par une PR (la CI rejoue les garde-fous : similarité, SEO, tests, e2e).

## 1. Relevé des prix (fiches outil)

- Pour chaque fichier de `src/content/outils/*.json` : ouvrir la page tarifs
  officielle (URL dans `sources`), relever les plans dans `plans[]` avec
  `prix_ht_mensuel`, `date_releve` (jour du relevé) et `url_source`.
- Jamais d'estimation : prix introuvable = `null` + ligne dans `TODO.md`.
- Mettre à jour `date_maj` de la fiche.

## 2. Liste des plateformes agréées

- Télécharger les fichiers officiels :
  https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees
- Régénérer `src/data/plateformes-agreees.json` (mêmes champs ; mettre à jour
  `provenance.date_registre` et `provenance.date_releve`). Si le relevé est fait
  directement sur impots.gouv.fr, remplacer `copie_consultee` par l'URL officielle
  et retirer l'avertissement.
- Vérifier que les 6 outils du site y figurent toujours.

## 3. Calendrier de la réforme

- Vérifier sur impots.gouv.fr / economie.gouv.fr qu'aucun texte n'a modifié les
  échéances ; mettre à jour `src/data/echeances.json` (`date_releve`, sources) le
  cas échéant. Aucune date n'est écrite en dur dans les pages : ce fichier est la
  source unique.
- La présentation partenaires est un instantané publié à part : après toute
  modification de `echeances.json`, des métiers ou des outils, lancer
  `pnpm build:presentation` puis republier `presentation/dist/pitch.html` à la
  même adresse d'Artifact (https://claude.ai/artifact/3BxhNJrafSYbS74YiwHN1J) (le commit et la date de relevé sont tamponnés en
  commentaire dans la page, ce qui permet de vérifier qu'elle est à jour).

## 4. Ajout de 10 métiers

- Choisir 10 métiers dans la réserve (familles sous-représentées en premier).
- Produire les contenus avec le pipeline habituel (rédaction sourcée →
  vérification adversariale → correction), puis
  `node --experimental-strip-types scripts/import-metiers.ts <sortie.json>`.
- La CI vérifie la similarité (seuil 0,5) et le SEO.

## 5. Contrôle des liens

- `node --experimental-strip-types scripts/check-links.ts` (depuis un réseau
  sans proxy bloquant) : teste toutes les URL sources et affiliées, échoue si
  un lien est cassé.
- Vérifier les redirections `/go/` en production après tout changement
  d'`affiliation.json` (`dist/_redirects` est régénéré au postbuild ; `check:liens`
  échoue si un lien `/go/` des pages n'a pas sa règle).

## 6. Vérifications transverses

- `pnpm verify` en local avant la PR (types, lint, format, tests, build, similarité,
  SEO, liens, CSP, rédaction, gabarits à compléter, présentation).
- Lighthouse sur 2 pages (accueil + 1 page métier), servies avec la vraie CSP
  (`dist/_headers`) : objectif 100 partout, CLS 0.
- Parcourir `TODO.md` : dépiler ce qui peut l'être (variables de lancement,
  données en attente de re-vérification).

## 7. Back office (`/admin`)

Liens d'affiliation et espaces publicitaires, sans toucher au code. Prérequis :
`TODO.md` #19 à #21 (éditeur identifié, règles de `main`, jeton à portée fine).

1. Ouvrir `/admin`, coller le jeton (le gestionnaire de mots de passe peut le
   remplir). Il reste en mémoire seulement : quitter la page, 30 minutes
   d'inactivité ou un refus de GitHub l'effacent.
2. **Liens d'affiliation** : URL fournie par le programme (https, ASCII ; un
   domaine accentué se saisit en `xn--`), réseau (publié sur `/transparence`), case « actif ». Un
   lien suspendu garde son URL mais le bouton revient au site officiel.
3. **Annonces** : annonceur et sa raison sociale avec SIREN (publiés sur
   `/transparence`), logiciel comparé s'il y a lieu (annonce limitée à l'accueil
   et aux guides), emplacement, dates (heure de Paris, fin incluse), textes,
   image facultative (WebP, PNG, JPEG, AVIF ; 640 × 360 px au moins ; 300 Ko au
   plus). Les formulations « recommandé », « classement », « n° 1 », « avis »,
   « plateforme agréée »… sont refusées.
4. **Publication** : une pull request vérifiée par la CI. « Mettre en ligne »
   ne s'active que si la CI du dépôt est verte sur ce commit, que la demande ne
   contient que des données du back office et que la branche est à jour. Une
   prévisualisation Netlify est proposée avant la mise en ligne.
5. Une annonce entre et sort à 0 h 05 (Paris) : la fonction planifiée ne lance
   un build que les nuits où la sélection change. Vérifier le lendemain matin
   l'email d'échec de déploiement éventuel.
6. Les annonceurs mesurent leurs visites par les paramètres `utm_*` ajoutés à
   leur lien ; le site ne mesure rien (vente au forfait).

## 8. Newsletter (mensuelle au plus)

- Rédiger à partir de ce que la routine mensuelle a changé (échéances,
  plateformes agréées, prix relevés, nouveaux métiers et guides), avec des
  données datées et sourcées comme sur le site.
- Aucun lien affilié ni publicité dans les emails (engagement affiché au point
  de collecte) ; liens vers les pages du site seulement.
- Pied de chaque envoi : identité de l'éditeur et lien de désinscription.
- Suivi des ouvertures et des clics désactivé dans Brevo (`TODO.md` #23).
- Une fois par an : supprimer dans Brevo les contacts désinscrits depuis plus de
  3 ans (durée de la liste d'opposition annoncée sur `/confidentialite`), pour la
  newsletter comme pour le rappel.

## 9. Règles de rédaction

Elles s'appliquent aux gabarits comme aux contenus (`src/content`, `src/data`).
`pnpm check:redaction` fait respecter celles qu'une machine peut vérifier, sur le
texte de `<main>` de chaque page construite (tableaux et titres de sources
exclus) ; le reste relève de la relecture.

- Vouvoiement ; phrases courtes ; un seul message par paragraphe.
- Ni tiret cadratin ni demi-cadratin ou trait d'union espacés dans la prose :
  une incise se met entre virgules ou entre parenthèses, une explication après un
  deux-points, jamais à la place d'un point. Exception : les mentions légales
  citées telles quelles (« Régime particulier - Biens d'occasion »).
- Pas de triade réflexe ni de formule « X, pas Y ». L'indépendance du classement
  se dit une fois par page au plus, avec un lien vers `/methode`, jamais dans un
  bouton.
- Libellés de lien explicites : ni « En savoir plus », ni « Découvrir ».
- Ni « Voici », « Concrètement », « Autrement dit », « Ce qu'il faut retenir »,
  ni suite de débuts de phrase en gras ; titres sans numéro de liste superflu.
- Dates : dans les gabarits, uniquement depuis `src/data/echeances.json`. Dans
  les contenus, la réception est déjà obligatoire (« vous devez déjà pouvoir
  recevoir ») ; l'émission et l'e-reporting restent « à l'échéance applicable à
  votre entreprise ».
- Typographie : écrire des espaces ordinaires avant « : ; ? ! » et dans « » ;
  le postbuild (`scripts/typographie-dist.ts`) pose les insécables dans le HTML.
  Dans un îlot Preact, passer le texte dynamique par `typographier()`
  (`src/lib/typographie.ts`) et écrire `&nbsp;` dans le texte littéral, sinon
  l'hydratation remet des espaces ordinaires (test e2e « espaces insécables
  conservés après hydratation »).
- Aucun renvoi interne (« TODO.md #13 ») dans un texte publié.

## 10. Design : polices, couleurs, image de partage

- Polices : Newsreader (titres) et Instrument Sans (texte), fichiers variables
  latins de `@fontsource-variable`, déclarés par l'API Fonts d'Astro dans
  `astro.config.mjs` (polices de repli ajustées générées, CLS 0). Pas d'italique.
- Couleurs : jetons `--color-*` de `src/styles/global.css`, clair et sombre. Le
  test `src/lib/contraste.test.ts` relit ces jetons et vérifie chaque paire
  (texte ≥ 4,5:1, bords de contrôles ≥ 3:1) : il échoue si un changement de
  palette casse un contraste.
- Aucune animation d'entrée ni boucle ; transitions de couleur seulement.
- Image de partage `public/og.png` : `pnpm og` la régénère depuis un gabarit
  local (couleurs lues dans `global.css`, polices du site). À relancer après un
  changement de palette, de polices ou de texte (`PW_CHROMIUM=…` pour un
  Chromium déjà installé). Elle ne porte ni chiffre, ni date, ni nom de site.
- Présentation partenaires (`presentation/`) : mêmes jetons et polices ;
  `pnpm build:presentation` la régénère depuis les données.
