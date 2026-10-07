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
  d'`affiliation.json` (le bloc netlify.toml est régénéré au build).

## 6. Vérifications transverses

- `pnpm verify` en local avant la PR (types, lint, tests, build, similarité, SEO).
- Lighthouse sur 2 pages (accueil + 1 page métier) : objectif ≥ 95 partout.
- Parcourir `TODO.md` : dépiler ce qui peut l'être (variables de lancement,
  données en attente de re-vérification).
