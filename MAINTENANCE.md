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

- `pnpm verify` en local avant la PR (types, lint, tests, build, similarité, SEO).
- Lighthouse sur 2 pages (accueil + 1 page métier) : objectif ≥ 95 partout.
- Parcourir `TODO.md` : dépiler ce qui peut l'être (variables de lancement,
  données en attente de re-vérification).

## 7. Back office (`/admin`)

Liens d'affiliation et espaces publicitaires, sans toucher au code. Prérequis :
`TODO.md` #19 à #21 (éditeur identifié, règles de `main`, jeton à portée fine).

1. Ouvrir `/admin`, coller le jeton (le gestionnaire de mots de passe peut le
   remplir). Il reste en mémoire seulement : quitter la page, 30 minutes
   d'inactivité ou un refus de GitHub l'effacent.
2. **Liens d'affiliation** : URL fournie par le programme (https, ASCII ; un
   domaine accentué se saisit en `xn--`), réseau en mémo, case « actif ». Un
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
