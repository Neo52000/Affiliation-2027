# Search Console : créer la propriété et la vérifier

Objectif : mesurer clics, impressions et positions moyennes par requête, page et appareil en France, et comparer les 3 fiches métier pilotes (consultant, photographe, plombier) aux 97 fiches témoins.

Le site sert aujourd'hui `https://affiliation2027.netlify.app` (origine par défaut de `src/config.ts`). On vérifie donc d'abord cette adresse, puis `efactureguide.fr` le jour où le domaine est branché.

Durée : environ 15 minutes, plus le temps d'un redéploiement Netlify.

## 1. Créer la propriété « Préfixe de l'URL »

1. Ouvrir https://search.google.com/search-console et se connecter avec le compte Google qui gérera le site.
2. Cliquer sur « Ajouter une propriété », puis choisir **Préfixe de l'URL**.
3. Saisir exactement `https://affiliation2027.netlify.app/` et cliquer sur « Continuer ».
4. Dans les méthodes de validation, ouvrir **Balise HTML**. Google affiche une balise de ce type :
   `<meta name="google-site-verification" content="AbCdEf…" />`
5. Copier **uniquement la valeur de `content`**, c'est-à-dire le jeton, sans les guillemets.
6. Laisser l'onglet ouvert sans cliquer sur « Valider » : la balise doit d'abord être en ligne.

La propriété « Domaine », qui couvre tout un domaine, est impossible sur `netlify.app` : elle demande un enregistrement DNS chez le propriétaire du domaine.

## 2. Publier la balise (Netlify, sans commit)

Le site ajoute la balise lui-même dès que la variable existe : composant `src/components/Seo.astro`, contrôle du format dans `src/lib/search-console.ts`.

1. Netlify → projet **affiliation2027** → **Project configuration** → **Environment variables** → **Add a variable**.
2. Clé : `GOOGLE_SITE_VERIFICATION`. Valeur : le jeton copié.
3. Portée : au minimum **Builds**. Contexte : **Production**, ou tous les contextes.
4. **Deploys** → **Trigger deploy** → **Deploy site**, puis attendre la fin du déploiement.
5. Contrôler : ouvrir le code source de `https://affiliation2027.netlify.app/` (Ctrl+U) et chercher `google-site-verification`. La balise doit contenir le jeton.

Pour plusieurs propriétés, mettre les jetons dans la même variable, séparés par des virgules. Un jeton mal formé (caractère autre que lettre, chiffre, `-` ou `_`) est ignoré : aucune balise n'est publiée pour lui.

## 3. Valider la propriété

Revenir dans Search Console et cliquer sur **Valider**. En cas d'échec :

- **Balise absente du code source** : la variable n'est pas dans le contexte Production, ou le site n'a pas été redéployé après son ajout.
- **Jeton différent** : vous avez recopié celui d'une autre tentative. Google en génère un par propriété et par compte.
- **Ne pas supprimer la variable** après la validation : Google revérifie régulièrement la balise.

## 4. Soumettre le sitemap

1. Search Console → **Sitemaps**.
2. Saisir `sitemap-index.xml` et cliquer sur **Envoyer**.
3. Résultat attendu : l'état « Opération effectuée », puis la découverte de `sitemap-0.xml` et de ses 152 URL. Ce nombre correspond aux URL soumises, pas aux pages indexées.

Le fichier `robots.txt` indique déjà ce sitemap. Les pages `/go/`, les mentions légales, la page de confidentialité et les pages d'état de la newsletter en sont exclues volontairement.

## 5. Demander l'indexation des pages prioritaires

Dans **Inspection de l'URL**, inspecter chaque adresse puis cliquer sur « Demander une indexation ». Google limite le nombre de demandes par jour.

1. `https://affiliation2027.netlify.app/`
2. `https://affiliation2027.netlify.app/facturation-electronique/consultant`
3. `https://affiliation2027.netlify.app/facturation-electronique/photographe`
4. `https://affiliation2027.netlify.app/facturation-electronique/plombier`
5. `https://affiliation2027.netlify.app/logiciels/abby`, puis les 5 autres fiches logiciels
6. `https://affiliation2027.netlify.app/comparatif/abby-vs-indy`

L'inspection doit afficher la même URL canonique que celle déclarée par la page, sans « .html » et sans slash final.

Les aperçus Netlify (`deploy-preview-…--affiliation2027.netlify.app`) renvoient un `X-Robots-Tag: noindex`. C'est voulu : il ne faut pas les ajouter comme propriété.

## 6. Rattacher la propriété au connecteur Impulsion

Pour que Claude puisse lire les performances (couples requête/page, France, par appareil), il faut rattacher la nouvelle propriété dans votre espace Impulsion, comme vos autres sites (ma-papeterie.fr, explorelidar.fr…).

Tant qu'elle n'y figure pas, aucun relevé n'est possible depuis une session Claude.

## 7. Le jour du branchement d'efactureguide.fr

1. **Domaine** : DNS chez le registraire, puis rattachement du domaine au projet Netlify et certificat HTTPS actif.
2. **Propriété Domaine** : Search Console → Ajouter une propriété → **Domaine** → `efactureguide.fr`. Google fournit un enregistrement **TXT**. L'ajouter dans la zone DNS du domaine, attendre sa propagation, puis valider.
3. **Origine du site** : variable Netlify `SITE_URL=https://efactureguide.fr`, puis redéploiement. Canonicals, sitemap, robots.txt et Open Graph basculent sans commit.
4. **Redirection** : décommenter la redirection 301 de `netlify.toml`, de `affiliation2027.netlify.app/*` vers `efactureguide.fr/:splat` (commit et PR).
5. **Changement d'adresse** : dans la propriété `affiliation2027.netlify.app`, Paramètres → **Changement d'adresse** → nouveau site `efactureguide.fr`, si l'outil accepte ce couple d'adresses. Sinon, la redirection 301 et le sitemap du nouveau domaine suffisent.
6. **Nouveau sitemap** : soumettre `sitemap-index.xml` dans la nouvelle propriété.
7. **Ancienne propriété** : la garder pendant la transition, pour suivre la désindexation des anciennes URL.

## 8. Mesurer le pilote (après 28 jours complets de données)

Rapport **Performances** → Recherche → filtres **Pays : France**, puis séparément **Appareil : mobile** et **ordinateur**.

- **Pilotes** : filtre Page contenant `/facturation-electronique/consultant`, `/photographe` ou `/plombier`.
- **Témoins** : quelques fiches comparables de même famille, par exemple `/facturation-electronique/electricien` pour le bâtiment, avec les mêmes filtres et la même période.
- **Comparaison** : deux périodes complètes de 28 jours, avec les mêmes filtres et la même dimension, en vue requête et page. Ne pas croiser deux exports faits séparément.
- **Rappel** : une position moyenne inférieure ou égale à 3 ne garantit pas d'apparaître dans le top 3 à chaque affichage. Seules les commissions validées par les partenaires mesurent les recettes.
