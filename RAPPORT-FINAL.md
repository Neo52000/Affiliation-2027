# Rapport final — comparateur de facturation électronique par métier

> Rapport de livraison demandé par la section 16 de la spécification.
> État au 6 octobre 2026.

## 1. Adresse de production

|                                |                                                  |
| ------------------------------ | ------------------------------------------------ |
| Site en production             | https://affiliation2027.netlify.app              |
| Hébergement                    | Netlify, site 100 % statique, build `pnpm build` |
| Branche déployée               | `main`, déploiement automatique à chaque fusion  |
| Scan de secrets au déploiement | **201 fichiers analysés, 0 secret détecté**      |

Le domaine définitif n'est pas encore branché : `DOMAINE` est un placeholder (TODO #2), si bien que les
canonicals, le sitemap et les cartes Open Graph portent une adresse provisoire. C'est le seul point
qui empêche la mise en ligne publique sur le nom de marque définitif, avec les mentions légales (TODO #3).

## 2. Pages livrées, par type

| Type                                                                            | Livré   | Cible spécification |
| ------------------------------------------------------------------------------- | ------- | ------------------- |
| Accueil                                                                         | **1**   | 1                   |
| Pages métier `/facturation-electronique/…`                                      | **100** | 100                 |
| Hubs de famille `/metiers/…`                                                    | **10**  | 10                  |
| Comparatifs deux à deux `/comparatif/…`                                         | **15**  | 15                  |
| Fiches outil `/logiciels/…`                                                     | **6**   | 6                   |
| Outils interactifs `/outils/…`                                                  | **3**   | 3                   |
| Guides piliers `/guides/…`                                                      | **10**  | 10                  |
| Registre des plateformes agréées                                                | **1**   | 1                   |
| Confiance et légal (méthode, transparence, à propos, mentions, confidentialité) | **5**   | 5                   |
| Page 404                                                                        | **1**   | 1                   |

Les dix familles de métiers sont complètes à dix métiers chacune : bâtiment, artisanat, commerce,
restauration, santé, professions libérales, numérique, services, agriculture, transport.

## 3. Lighthouse — quatre axes, tous les types de page

Mesures locales sur le build de production, préréglage desktop.

> Limite découverte le 2026-10-08 : ces mesures tournaient sur `astro preview`, qui n'applique pas les
> en-têtes Netlify. La CSP de production bloquait alors les scripts en ligne d'Astro et les îlots
> (quiz, simulateur, vérificateur) ne s'hydrataient pas. C'est corrigé : la CSP est générée par
> empreintes dans `dist/_headers` et contrôlée par `check-csp`. Les prochaines mesures se font avec
> ces en-têtes.

| Page                     | Performance | Accessibilité | Bonnes pratiques | SEO    | CLS | LCP   |
| ------------------------ | ----------- | ------------- | ---------------- | ------ | --- | ----- |
| Accueil                  | 100         | 100           | 100              | 100    | 0   | 0,4 s |
| Page métier              | 100         | 100           | 100              | 100    | 0   | 0,3 s |
| Hub de famille           | 100         | 100           | 100              | 100    | 0   | 0,3 s |
| Comparatif               | 100         | 100           | 100              | 100    | 0   | 0,3 s |
| Fiche outil              | 100         | 100           | 100              | 100    | 0   | 0,3 s |
| Registre des plateformes | 100         | 100           | 100              | 100    | 0   | 0,3 s |
| Quiz                     | 100         | 100           | 100              | 100    | 0   | 0,4 s |
| Simulateur d'échéance    | 100         | 100           | 100              | 100    | 0   | 0,4 s |
| Vérificateur de facture  | 100         | 100           | 100              | 100    | 0   | 0,4 s |
| Guide pilier             | 100         | 100           | 100              | 100    | 0   | 0,3 s |
| Transparence             | 100         | 100           | 100              | 100    | 0   | 0,3 s |
| À propos                 | 100         | 100           | 100              | **66** | 0   | 0,3 s |
| 404                      | 100         | 100           | 100              | **66** | 0   | 0,3 s |

Les deux scores SEO de 66 sont **voulus** et ne sont pas un défaut : le seul audit en échec est
« Page is blocked from indexing », vérifié audit par audit. La page À propos reste hors index tant que
l'identité de l'éditeur est un placeholder (TODO #3), et une page d'erreur n'a pas à être indexée.

Au-delà de Lighthouse, qui ne contrôle pas ce critère : les bordures de composants d'interface ont été
mesurées à **4,55:1** en thème clair et **5,07:1** en thème sombre, au-dessus du seuil de 3:1 de la règle
WCAG 1.4.11. La version précédente était à 1,45:1.

## 4. Tests et garde-fous automatiques

| Contrôle                                       | Résultat                                      | Où il tourne |
| ---------------------------------------------- | --------------------------------------------- | ------------ |
| `astro check` (TypeScript le plus strict)      | 0 erreur                                      | local + CI   |
| ESLint                                         | propre                                        | local + CI   |
| Prettier                                       | propre                                        | local + CI   |
| Tests unitaires Vitest                         | **77 tests, 10 fichiers**                     | local + CI   |
| Parcours Playwright de bout en bout            | **6 parcours**                                | local + CI   |
| `check:similarity` — anti-duplication          | **4 950 paires, maximum 21,2 %** (seuil 50 %) | local + CI   |
| `check:seo` — titles, descriptions, canonicals | **150 pages indexables** conformes            | local + CI   |
| `check:liens` — cibles internes                | **5 345 liens, 0 cassé**                      | local + CI   |

Trois garde-fous bloquants, pas deux : `check:liens` a été ajouté après avoir constaté que les
15 pages de comparatif avaient vécu plusieurs phases sans qu'aucun lien n'y mène, sans qu'aucune
alerte ne se déclenche. Il a été éprouvé en cassant volontairement un lien, pour vérifier qu'il échoue
avec le code 1 et nomme la page fautive.

Non couvert par la CI, à lancer depuis un réseau non filtré : `check:links`, qui teste les URL
**externes** des sources. Le proxy de l'environnement de construction bloque les domaines `.gouv.fr`.

Les dix guides piliers font **1 434 à 1 555 mots** (cible 1 200 à 2 000), portent **10 à 20 sources
officielles** chacune, et ont tous passé une vérification adversariale suivie d'une correction :
**10 points bloquants** ont été relevés et traités avant publication. Leur sommaire est construit depuis
les titres réels de chaque guide, jamais depuis une liste figée : 84 ancres au total, **aucune morte**.

## 5. Variables de lancement non renseignées

Sept variables restent des placeholders. Le détail et l'impact de chacune sont dans `TODO.md`, points 1 à 7.

| #   | Variable           | Conséquence tant qu'elle n'est pas fournie                                                  |
| --- | ------------------ | ------------------------------------------------------------------------------------------- |
| 1   | `NOM_SITE`         | Nom de marque absent du gabarit, des titles et du JSON-LD                                   |
| 2   | `DOMAINE`          | Canonicals, sitemap et Open Graph sur un domaine provisoire                                 |
| 3   | `EDITEUR_LEGAL`    | `/mentions-legales` non conforme LCEN — **bloquant avant mise en ligne**                    |
| 4   | `EMAIL_CONTACT`    | Mentions légales et contact incomplets                                                      |
| 5   | `EXPERT_RELECTEUR` | Bloc relecteur masqué — aucun relecteur fictif n'est affiché                                |
| 6   | `LIENS_AFFILIES`   | Les boutons pointent vers les sites officiels, sans mention d'affiliation — **zéro revenu** |
| 7   | `OUTIL_EMAIL`      | Formulaire de capture désactivé                                                             |

## 6. Données non vérifiables depuis cet environnement

Le proxy réseau de l'environnement de construction bloque l'accès direct aux domaines `.gouv.fr` et
aux sites des éditeurs. Tout le relevé réglementaire repose sur des extraits indexés restreints aux
domaines officiels, recoupés sur au moins deux pages par affirmation. Onze points, détaillés dans
`TODO.md` 8 à 18, demandent une vérification humaine depuis un réseau non filtré.

Les deux plus conséquents commercialement :

- **TODO #13 — aucun prix d'outil n'est publié.** Aucun tarif n'a pu être relevé avec une date et une
  URL vérifiées en direct. Le site n'affiche donc aucun prix, plutôt qu'un prix approximatif.
- **TODO #18 — le statut de plateforme agréée d'Indy n'est pas confirmé.** Un vérificateur ne l'a pas
  retrouvé sur la liste officielle alors que les cinq autres outils y figurent. Ce statut n'étant plus
  réaffirmé en texte libre mais rendu depuis la donnée, **un seul champ** corrige les 100 pages si la
  vérification l'infirme.

Aucune note de test n'est publiée : les six fiches outil affichent « Test en cours », conformément à
la règle « jamais de note avant un test réel documenté ».

## 7. Décisions prises hors de la lettre de la spécification

| Décision                                           | Raison                                                                                                                                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schéma de facture assoupli sur trois cas           | Les rédacteurs avaient raison et le schéma avait tort : ligne d'acompte à montant négatif, émolument au tarif réglementé non reproduit, TVA hors champ. Le composant rend ces cas sans mentir plutôt que de les refuser. |
| Jamais « TVA 0 % » en franchise en base            | Un taux affiché, fût-il nul, rendrait l'entreprise redevable de la taxe. La colonne porte « — » avec sa légende.                                                                                                         |
| Largeur de lecture à 54ch, non 70ch                | 70ch rendait 86 caractères par ligne, l'unité `ch` valant l'avance du glyphe « 0 ». Mesuré à 71 caractères après correction.                                                                                             |
| Statut de plateforme agréée rendu depuis la donnée | Il était réaffirmé à la main dans les 300 justifications d'outils, en 225 formulations distinctes. Une affirmation réglementaire recopiée trois cents fois ne peut que dériver.                                          |
| `check:liens` ajouté aux garde-fous                | Non demandé par la spécification, mais un défaut de structure s'était déjà produit sans alerte.                                                                                                                          |
| `format:check` ajouté à `pnpm verify`              | La CI l'exécutait, `verify` non : un échec CI sur du vert local. Le trou a été comblé plutôt que les fichiers seulement reformatés.                                                                                      |
| 21 fiches publiées non réécrites                   | L'assembleur proposait de les remplacer ; vérification faite, 15 différences de mise en forme et 6 reformulations équivalentes, aucune correction de fond.                                                               |

## 8. Conformité au positionnement

| Engagement de la spécification         | État                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Angle par métier                       | 100 pages métier, chacune avec ses spécificités propres ; similarité maximale 21,2 %                                                       |
| Classement indépendant des commissions | Les commissions n'entrent dans aucun calcul, ni dans le quiz, ni dans l'ordre ; méthode publique sur `/methode`                            |
| Tests réels documentés                 | Aucune note publiée ; « Test en cours » assumé sur les six fiches                                                                          |
| Données datées et sourcées             | Chaque affirmation réglementaire renvoie à une source officielle datée ; les données non vérifiables sont `null` et listées dans `TODO.md` |
| Aucune date de réforme en dur          | Les dates ne vivent que dans `echeances.json` ; les contenus écrivent « à l'échéance applicable à votre entreprise »                       |
| Aucun cookie soumis à consentement     | Aucun traceur, aucune bannière                                                                                                             |
| Vouvoiement                            | Respecté sur l'ensemble des contenus                                                                                                       |
| Secrets hors du dépôt                  | Confirmé par le scan Netlify : 201 fichiers, 0 secret                                                                                      |
