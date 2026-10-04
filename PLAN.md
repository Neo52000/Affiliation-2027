# PLAN.md — Phase 0 : plan du site « facturation électronique par métier »

Date : 2026-10-04 · Statut : **en attente de validation humaine** (gate imposée par la spécification, section 13)

## 1. Objet

Site statique Astro en français aidant TPE, artisans, professions libérales et micro-entrepreneurs à choisir leur logiciel de facturation électronique et leur compte pro, monétisé par affiliation. Objectif build : 100 pages métier indexables, 3 outils interactifs, Lighthouse ≥ 95 sur les 4 axes.

Positionnement non négociable : angle par **métier** (pas par statut), classement **indépendant des commissions** (méthode publique `/methode`), **tests réels** documentés (fiches `statut: a_tester`, jamais de résultat inventé), données **datées et sourcées**.

## 2. Arborescence du site

| Route                                                              | Volume | Rôle                                                                                |
| ------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| `/`                                                                | 1      | Quiz au-dessus de la ligne de flottaison, 3 preuves de confiance, accès par famille |
| `/facturation-electronique/{metier}`                               | 100    | Pages métier (gabarit section 6 de la spec)                                         |
| `/metiers/{famille}`                                               | 10     | Hubs famille                                                                        |
| `/logiciels/{outil}`                                               | 6 → 12 | Fiches outil                                                                        |
| `/comparatif/{a}-vs-{b}`                                           | 15     | Toutes les paires des 6 outils principaux                                           |
| `/guides/{slug}`                                                   | 10     | Guides piliers (1 200–2 000 mots, sourcés)                                          |
| `/outils/quiz`, `/outils/echeance`, `/outils/verificateur-facture` | 3      | Îlots interactifs (Preact), dégradation sans JS                                     |
| `/plateformes-agreees`                                             | 1      | Tableau filtrable de la liste officielle DGFiP, date de relevé visible              |
| `/methode`, `/a-propos`, `/transparence`                           | 3      | Confiance                                                                           |
| `/mentions-legales`, `/confidentialite`                            | 2      | Légal (LCEN, RGPD)                                                                  |
| `/go/{slug}`                                                       | 6      | Redirections 302 affiliées (netlify.toml), exclues de robots.txt                    |

Total au lancement : **151 pages indexables** + redirections.

## 3. Arborescence du dépôt

```
src/
  content/
    outils/        # 1 YAML par logiciel (schéma Zod section 5 de la spec)
    metiers/       # 1 YAML par métier
    guides/        # MDX
    tests/         # fiches de test réel, statut: a_tester
  data/
    plateformes-agreees.json   # liste officielle DGFiP + date de relevé
    echeances.json             # calendrier réforme + URL sources
    affiliation.json           # slug -> URL affiliée
  components/      # AffiliateButton, tableaux, fil d'Ariane…
  layouts/
  pages/
scripts/
  check-similarity.ts   # Jaccard shingles 5 mots, build FAIL si > 0,5
  check-links.ts        # test de toutes les URL sources et affiliées
  check-seo.ts          # unicité titles/descriptions, longueurs
netlify.toml            # redirections /go/, en-têtes sécurité
netlify/functions/      # capture email (double opt-in)
```

## 4. Liste des 100 métiers (10 familles × 10)

Critères de sélection : population de TPE/indépendants élevée, spécificités de facturation marquées, volume de recherche attendu sur « facturation électronique + métier ». Les spécificités listées servent au cadrage éditorial ; chacune sera vérifiée et sourcée sur source officielle au moment de la rédaction de la page (phases 3-4).

### Bâtiment

| Métier              | Slug               | Spécificité de facturation dominante                       |
| ------------------- | ------------------ | ---------------------------------------------------------- |
| Plombier            | `plombier`         | Acomptes, TVA 10 %/5,5 % rénovation, dépannage urgence     |
| Électricien         | `electricien`      | Attestation TVA réduite, autoliquidation en sous-traitance |
| Maçon               | `macon`            | Situations de travaux, retenue de garantie                 |
| Couvreur            | `couvreur`         | TVA réduite rénovation, acomptes                           |
| Chauffagiste        | `chauffagiste`     | TVA 5,5 % rénovation énergétique, contrats d'entretien     |
| Menuisier           | `menuisier`        | Fourniture + pose, acomptes sur-mesure                     |
| Peintre en bâtiment | `peintre-batiment` | Devis détaillés, TVA réduite                               |
| Carreleur           | `carreleur`        | Situations de travaux, sous-traitance                      |
| Plaquiste           | `plaquiste`        | Autoliquidation TVA sous-traitance BTP                     |
| Paysagiste          | `paysagiste`       | TVA selon nature des travaux, contrats d'entretien         |

### Santé

| Métier              | Slug                  | Spécificité                                    |
| ------------------- | --------------------- | ---------------------------------------------- |
| Infirmier libéral   | `infirmier-liberal`   | Exonération TVA, tiers payant, rétrocessions   |
| Kinésithérapeute    | `kinesitherapeute`    | Exonération TVA, tiers payant                  |
| Ostéopathe          | `osteopathe`          | Exonération TVA, notes d'honoraires B2C        |
| Sage-femme          | `sage-femme`          | Exonération TVA, conventionnement              |
| Orthophoniste       | `orthophoniste`       | Exonération TVA, tiers payant                  |
| Pédicure-podologue  | `pedicure-podologue`  | Actes exonérés vs semelles (TVA mixte)         |
| Psychologue         | `psychologue`         | Exonération conditionnelle                     |
| Diététicien         | `dieteticien`         | Exonération conditionnelle, forfaits           |
| Chirurgien-dentiste | `chirurgien-dentiste` | Soins exonérés vs prothèses                    |
| Vétérinaire         | `veterinaire`         | TVA 20 %, actes + médicaments, clientèle mixte |

### Commerce

| Métier                | Slug                    | Spécificité                                         |
| --------------------- | ----------------------- | --------------------------------------------------- |
| Fleuriste             | `fleuriste`             | TVA multi-taux, prestations événements              |
| Caviste               | `caviste`               | Droits d'accise, B2B CHR                            |
| Boucher-charcutier    | `boucher-charcutier`    | TVA 5,5 %/10 %, tickets + B2B                       |
| Épicerie fine         | `epicerie-fine`         | TVA multi-taux, paniers cadeaux B2B                 |
| Opticien              | `opticien`              | Part LPP + part libre, tiers payant mutuelles       |
| Libraire-papetier     | `libraire-papetier`     | TVA livre 5,5 %, prix unique, marchés scolaires     |
| E-commerçant          | `e-commercant`          | Ventes à distance UE (OSS), facturation automatisée |
| Brocanteur-antiquaire | `brocanteur-antiquaire` | TVA sur marge, livre de police                      |
| Bijoutier             | `bijoutier`             | TVA sur marge occasion, métaux précieux             |
| Prêt-à-porter         | `pret-a-porter`         | Soldes, avoirs et retours                           |

### Services

| Métier                    | Slug                      | Spécificité                                               |
| ------------------------- | ------------------------- | --------------------------------------------------------- |
| Coiffeur                  | `coiffeur`                | Tickets B2C, franchise en base fréquente                  |
| Esthéticienne             | `estheticienne`           | Forfaits/cures, acomptes de réservation                   |
| Photographe               | `photographe`             | Cession de droits vs prestation, acomptes mariage         |
| Garagiste                 | `garagiste`               | Pièces + main-d'œuvre, créances assureurs                 |
| Agent immobilier          | `agent-immobilier`        | Honoraires loi Hoguet, mandats                            |
| Formateur                 | `formateur`               | Exonération TVA formation, BPF, conventions               |
| Auto-école                | `auto-ecole`              | Forfaits CPF, échéanciers élèves                          |
| Entreprise de nettoyage   | `entreprise-nettoyage`    | Contrats récurrents, facturation mensuelle                |
| Aide à domicile           | `aide-a-domicile`         | SAP, avance immédiate crédit d'impôt, attestation fiscale |
| Organisateur d'événements | `organisateur-evenements` | Acomptes, débours, multi-prestataires                     |

### Libéral

| Métier                              | Slug                            | Spécificité                                 |
| ----------------------------------- | ------------------------------- | ------------------------------------------- |
| Avocat                              | `avocat`                        | Honoraires + débours, aide juridictionnelle |
| Expert-comptable                    | `expert-comptable`              | Lettres de mission, honoraires récurrents   |
| Architecte                          | `architecte`                    | Honoraires par phases, acomptes             |
| Notaire                             | `notaire`                       | Émoluments réglementés, débours             |
| Commissaire de justice              | `commissaire-de-justice`        | Tarifs réglementés, débours                 |
| Géomètre-expert                     | `geometre-expert`               | Marchés publics                             |
| Consultant                          | `consultant`                    | TJM, acomptes, autoliquidation UE           |
| Traducteur-interprète               | `traducteur`                    | Clients étrangers, TVA intracommunautaire   |
| Conseiller en gestion de patrimoine | `conseiller-gestion-patrimoine` | Honoraires vs rétrocessions                 |
| Diagnostiqueur immobilier           | `diagnostiqueur-immobilier`     | Rapports normés, B2B/B2C                    |

### Artisanat

| Métier                  | Slug              | Spécificité                                   |
| ----------------------- | ----------------- | --------------------------------------------- |
| Ébéniste                | `ebeniste`        | Sur-mesure, acomptes                          |
| Tapissier d'ameublement | `tapissier`       | Fourniture + façon                            |
| Cordonnier              | `cordonnier`      | Tickets B2C, multiservices, franchise en base |
| Céramiste               | `ceramiste`       | Vente directe, dépôt-vente, marchés           |
| Créateur de bijoux      | `createur-bijoux` | Vente en ligne + marchés                      |
| Couturière-retoucheuse  | `couturiere`      | Retouches B2C, franchise en base              |
| Ferronnier              | `ferronnier`      | Sur-mesure bâtiment, pose                     |
| Serrurier               | `serrurier`       | Dépannage urgence (encadrement des devis)     |
| Horloger-réparateur     | `horloger`        | Réparation + vente de pièces                  |
| Toiletteur              | `toiletteur`      | Tickets B2C, abonnements                      |

### Numérique

| Métier                          | Slug                     | Spécificité                              |
| ------------------------------- | ------------------------ | ---------------------------------------- |
| Développeur freelance           | `developpeur-freelance`  | TJM, clients UE/hors UE, autoliquidation |
| Graphiste                       | `graphiste`              | Cession de droits d'auteur, acomptes     |
| UX/UI designer                  | `ux-designer`            | Forfaits projet, clients étrangers       |
| Rédacteur web                   | `redacteur-web`          | Droits d'auteur vs prestation            |
| Community manager               | `community-manager`      | Abonnements mensuels                     |
| Consultant SEO                  | `consultant-seo`         | Abonnements + missions one-shot          |
| Data analyst                    | `data-analyst`           | TJM, missions longues                    |
| Motion designer                 | `motion-designer`        | Cession de droits, acomptes              |
| Dépanneur informatique          | `depanneur-informatique` | Interventions B2C/B2B, forfaits + régie  |
| Créateur de formations en ligne | `formateur-en-ligne`     | TVA formation vs produit numérique       |

### Transport

| Métier                                    | Slug                   | Spécificité                                     |
| ----------------------------------------- | ---------------------- | ----------------------------------------------- |
| Taxi                                      | `taxi`                 | Conventionnement CPAM, tarifs réglementés       |
| VTC                                       | `vtc`                  | Plateformes et autofacturation, TVA 10 %        |
| Transporteur routier                      | `transporteur-routier` | Lettre de voiture, B2B, gazole professionnel    |
| Chauffeur-livreur                         | `chauffeur-livreur`    | Sous-traitance messagerie, autofacturation      |
| Coursier à vélo                           | `coursier-velo`        | Plateformes, micro-entreprise                   |
| Ambulancier                               | `ambulancier`          | Conventionnement sécurité sociale, tiers payant |
| Déménageur                                | `demenageur`           | Devis obligatoire, acomptes                     |
| Autocariste                               | `autocariste`          | TVA 10 %, marchés scolaires et publics          |
| Dépanneur-remorqueur auto                 | `depanneur-auto`       | Tarifs réglementés autoroute, assureurs         |
| Transport de personnes à mobilité réduite | `tpmr`                 | Conventionnement, marchés publics               |

### Restauration

| Métier          | Slug              | Spécificité                                |
| --------------- | ----------------- | ------------------------------------------ |
| Restaurateur    | `restaurateur`    | TVA 10 %/5,5 %/20 % selon consommation     |
| Traiteur        | `traiteur`        | Devis événements, acomptes, TVA multi-taux |
| Food truck      | `food-truck`      | Vente à emporter, emplacements             |
| Pizzeria        | `pizzeria`        | TVA mixte livraison/sur place              |
| Crêperie        | `creperie`        | TVA mixte, saisonnalité                    |
| Bar-brasserie   | `bar-brasserie`   | TVA 20 % alcools, licence                  |
| Chef à domicile | `chef-a-domicile` | Prestation + denrées                       |
| Boulanger       | `boulanger`       | TVA 5,5 %, tickets + B2B restaurants       |
| Pâtissier       | `patissier`       | Commandes événements, acomptes             |
| Glacier         | `glacier`         | Saisonnalité, TVA selon consommation       |

### Agriculture

| Métier                            | Slug                             | Spécificité                                           |
| --------------------------------- | -------------------------------- | ----------------------------------------------------- |
| Agriculteur (grandes cultures)    | `agriculteur`                    | TVA agricole, remboursement forfaitaire, coopératives |
| Maraîcher                         | `maraicher`                      | Vente directe, AMAP, marchés                          |
| Viticulteur                       | `viticulteur`                    | Droits d'accise, DRM, export                          |
| Éleveur bovin                     | `eleveur-bovin`                  | Ventes en coopérative, TVA agricole                   |
| Apiculteur                        | `apiculteur`                     | Vente directe, micro-BA                               |
| Horticulteur-pépiniériste         | `horticulteur`                   | TVA multi-taux plants/fleurs                          |
| Arboriculteur                     | `arboriculteur`                  | Saisonnalité, coopératives                            |
| Conchyliculteur                   | `conchyliculteur`                | Vente directe + mareyage                              |
| Entrepreneur de travaux agricoles | `entrepreneur-travaux-agricoles` | Prestations inter-exploitations                       |
| Fromager fermier                  | `fromager-fermier`               | Vente directe, normes sanitaires                      |

## 5. Outils couverts

**6 outils du lancement** (programmes d'affiliation visés par la spec) : Tiime, Qonto, Pennylane, Abby, Indy, Shine. Fiches créées en Phase 2 avec données 100 % sourcées (prix HT, date de relevé, URL source) et `statut_test: a_tester`.

**6 candidats pour atteindre les 12 fiches visées** (à évaluer en Phase 2, aucun engagement) : Axonaut, Sellsy, Evoliz, Henrri, Freebe, Blank. Critères d'inclusion : pertinence TPE/indépendants, statut vis-à-vis de la réforme, données tarifaires publiques vérifiables.

Rappel : les commissions ne s'affichent jamais et n'entrent jamais dans la notation (pondération publique : conformité 25 %, prix 12 mois 20 %, simplicité 20 %, fonctionnalités métier 20 %, support 10 %, pérennité 5 % ; note `null` + « Test en cours » tant que `statut_test = a_tester`).

## 6. Sources officielles relevées

**Date de relevé : 2026-10-04.** Méthode et limite : le proxy réseau de l'environnement de build bloque l'accès HTTP direct aux domaines .gouv.fr et aux sites des éditeurs ; chaque fait a été vérifié via les extraits indexés du moteur de recherche **restreints aux domaines officiels**, avec recoupement sur au moins deux pages officielles par affirmation réglementaire, puis passé au contrôle d'un agent critique. Une relecture humaine directe des pages est recommandée avant publication (tracée dans `TODO.md`).

### 6.1 Calendrier de la réforme — CONFIRMÉ, publiable

| Obligation                                                                          | Date                           | Statut au 04/10/2026                               | Source officielle                                                                                                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Réception pour toutes les entreprises assujetties à la TVA (y c. franchise en base) | 1er septembre 2026             | **En vigueur**                                     | [impots.gouv.fr — Je découvre la facturation électronique](https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique)                    |
| Émission pour grandes entreprises et ETI                                            | 1er septembre 2026             | **En vigueur**                                     | [economie.gouv.fr — Tout savoir sur la facturation électronique](https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises) |
| Émission pour PME, TPE et micro-entreprises                                         | 1er septembre 2027             | À venir (émission volontaire possible dès 09/2026) | [impots.gouv.fr — Je découvre la facturation électronique](https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique)                    |
| E-reporting (données de transaction et de paiement)                                 | Même calendrier que l'émission | Mixte                                              | idem                                                                                                                                                            |

Faits complémentaires sourcés : entrée en vigueur effective sans report ([entreprendre.service-public.gouv.fr, actualité A18953](https://entreprendre.service-public.gouv.fr/actualites/A18953)) ; tolérance de démarrage — « aucune sanction en 2026, priorité à l'accompagnement » ([communiqué ministériel du 01/09/2026](https://presse.economie.gouv.fr/la-facturation-demarre-aujourdhui-priorite-a-laccompagnement-des-entreprises/)).

### 6.2 Base légale (pour `echeances.json`)

- Article 91, loi n° 2023-1322 du 29/12/2023 de finances pour 2024 — [Légifrance](https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000048727444)
- Article 290 B du CGI (version en vigueur, emploie « plateformes agréées ») — [Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044045452)
- Article 123, loi n° 2026-103 du 19/02/2026 de finances pour 2026 (calendrier inchangé) — [Légifrance](https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000053508878)
- Décret n° 2026-677 du 27/07/2026 — [Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054499487) ; arrêté du 27/07/2026 — [Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054499535)

### 6.3 Plateformes agréées — terminologie et liste officielle

- Terminologie officielle : **« plateforme agréée » (PA)** remplace « PDP » ; immatriculation DGFiP 3 ans renouvelables (art. 290 B CGI ; [actualité impots.gouv.fr](https://www.impots.gouv.fr/actualite/facturation-electronique-publication-de-la-liste-des-plateformes-agreees)).
- Liste officielle : [impots.gouv.fr — Je consulte la liste des plateformes agréées](https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees). Première publication le 16/01/2026 : 101 plateformes immatriculées ([economie.gouv.fr](https://www.economie.gouv.fr/actualites/facturation-electronique-la-liste-des-101-premieres-plateformes-agreees-est-disponible)).
- Pas de jeu de données publié par la DGFiP elle-même sur data.gouv.fr (seulement des republications tierces, non publiables comme source).
- **Non publiable en l'état** (sources tierces uniquement, voir `TODO.md`) : compteur actuel de PA (~150 selon un CSV tiers), dates précises et numéros d'immatriculation des outils, sous-statut « définitive » vs « en attente de rapport d'audit ».

### 6.4 Les 6 outils — faits de cadrage

| Outil     | Site / tarifs                                                                                        | Au registre PA DGFiP        | Programme d'affiliation                                               | Cible revendiquée                    |
| --------- | ---------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| Tiime     | [tiime.fr](https://www.tiime.fr/) · [/tarifs](https://www.tiime.fr/tarifs)                           | Oui (« TIIME PDP »)         | [Affilae](https://www.tiime.fr/affiliation)                           | Indépendants, freelances, TPE, micro |
| Qonto     | [qonto.com/fr](https://qonto.com/fr) · [/fr/pricing](https://qonto.com/fr/pricing)                   | Oui                         | [Direct](https://qonto.com/fr/affiliate) + réseau Awin                | PME et indépendants                  |
| Pennylane | [pennylane.com/fr](https://www.pennylane.com/fr) · [/fr/tarifs](https://www.pennylane.com/fr/tarifs) | Oui                         | [Affilae](https://affilae.com/fr/programme-affiliation-pennylane-fr/) | TPE/PME + experts-comptables         |
| Abby      | [abby.fr](https://abby.fr/) · [/tarifs](https://abby.fr/tarifs)                                      | Oui (sourcé impots.gouv.fr) | [Affilae](https://lp.abby.fr/partenaires/affiliation)                 | Indépendants, micro-entrepreneurs    |
| Indy      | [indy.fr](https://www.indy.fr/) · [/prix/](https://www.indy.fr/prix/)                                | Oui (sourcé impots.gouv.fr) | [Affilae](https://www.indy.fr/affiliation/)                           | Indépendants                         |
| Shine     | [shine.fr](https://www.shine.fr/) · [/tarifs/](https://www.shine.fr/tarifs/)                         | Oui                         | Affilae (confirmation 2026 à refaire)                                 | Indépendants, freelances, TPE        |

Prix et fonctionnalités : volontairement **non relevés** en Phase 0 (objet de la Phase 2, avec date de relevé et URL source par donnée). Le statut PA des éditeurs sera re-sourcé sur la liste impots.gouv.fr (pas sur leurs pages marketing) dans les fiches outil.

### 6.5 Concurrence (alimente les risques)

- L'angle « par métier » est **déjà partiellement occupé** : comparatif-facture-electronique.fr (hub « 63 activités », méthode publique, un seul auteur), comparateur-efacturation.fr (~10 secteurs), indy.fr (pages métier programmatiques d'éditeur).
- Faiblesses transverses observées chez les concurrents : les blogs d'éditeurs se classent eux-mêmes n°1 (Shine, Tiime, Qonto), compteurs de PA incohérents d'un site à l'autre (137/147/149/166 à la même période), données rarement datées.
- SERPs « facturation électronique + métier » fragmentées, dominées par des éditeurs verticaux (ex. Obat pour le BTP, Agathe You pour les IDEL) — pas par des comparateurs transverses : l'espace est ouvert pour un comparateur indépendant profond par métier.

## 7. Risques et mitigations

| Risque                                                                                       | Impact                                           | Mitigation                                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calendrier réglementaire mouvant** (reports déjà survenus dans l'historique de la réforme) | Contenu obsolète, perte de confiance             | Dates uniquement dans `echeances.json` (source unique), bandeau date de relevé, routine mensuelle `MAINTENANCE.md`, aucune date en dur dans les gabarits          |
| **Duplication de contenu programmatique** (100 pages sur un même sujet)                      | Pénalité qualité Google                          | Règle bloquante ≥ 50 % de texte propre, `check-similarity.ts` (Jaccard > 0,5 = build FAIL), exemples de facture et FAQ réellement spécifiques par métier          |
| **Dépendance aux 6 programmes d'affiliation**                                                | Revenu nul si un programme ferme                 | Candidats de réserve (section 5), bouton bascule automatique vers URL officielle si lien affilié absent                                                           |
| **YMYL / E-E-A-T** : sujet fiscal sans auteur identifié                                      | Déclassement SEO                                 | Bloc auteur + relecteur (EXPERT_RELECTEUR), méthode publique, sources officielles liées sur chaque affirmation, encart « ne remplace pas votre expert-comptable » |
| **Variables légales non renseignées** (EDITEUR_LEGAL…)                                       | Mise en ligne non conforme LCEN                  | Bloquant tracé dans `TODO.md` ; le déploiement Phase 9 exige ces valeurs                                                                                          |
| **Budget perf** (JS < 30 ko hors outils, LCP < 1,5 s)                                        | Échec critère Lighthouse ≥ 95                    | Sortie 100 % statique, îlots Preact uniquement sur les 3 outils, polices auto-hébergées 2 graisses, audit à chaque phase                                          |
| **Fiches de test non remplies** (l'éditeur humain doit tester)                               | Notes `null` durables, pages moins convaincantes | Affichage « Test en cours » assumé, structure de fiche prête, relance dans `TODO.md`                                                                              |
| **Angle métier déjà partiellement occupé** (§6.5 : un hub « 63 activités » existe)           | Différenciation réduite                          | Profondeur réelle par page (exemple de facture, FAQ, spécificités vérifiées) vs déclinaisons d'un même comparatif ; 100 métiers ; méthode + tests réels publics   |
| **Accès réseau bloqué vers .gouv.fr depuis l'environnement de build**                        | Données vérifiées via index, pas en direct       | Recoupement multi-sources systématique en build ; relecture humaine des pages sources avant mise en ligne (tracée dans `TODO.md`)                                 |

## 8. Décisions prises hors spécification

1. Variables section 0 toutes absentes → placeholders `TODO_xxx` + tableau d'impact dans `TODO.md` (règle de la spec appliquée, aucun blocage).
2. Dépôt distant vide → création d'une branche `main` de base (bootstrap) pour permettre la PR de la branche de travail `claude/new-session-3pcm2s`.
3. Le relevé exhaustif prix/fonctionnalités par outil est reporté à la Phase 2 (la spec ne l'exige qu'en Phase 2) ; la Phase 0 relève le calendrier, la liste PA, les URLs officielles et l'existence des programmes d'affiliation.
4. 15 comparatifs (paires des 6 outils) : C(6,2) = 15, conforme à « toutes les paires ».

## 9. Déroulé des phases suivantes

| Phase                  | Livrable                                                                           | Critère d'acceptation                            |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1. Socle               | Astro + Tailwind + TS strict, design system, layout, netlify.toml, CI              | Build vert, Lighthouse ≥ 95 sur page vide        |
| 2. Données             | Schémas Zod, 6 fiches outil sourcées, `echeances.json`, `plateformes-agreees.json` | Zéro donnée sans source ni date                  |
| 3. Pilotes             | 10 pages métier, 1 hub, 1 comparatif, 1 fiche outil                                | **Validation humaine**                           |
| 4. Échelle             | 100 pages métier, 10 hubs, 15 comparatifs                                          | `check-similarity.ts` vert                       |
| 5. Guides              | 10 guides piliers                                                                  | Chaque affirmation sourcée                       |
| 6. Outils              | Quiz, simulateur échéance, vérificateur facture                                    | Vitest (20 cas quiz) + Playwright verts          |
| 7. Affiliation + email | `/go/`, `<AffiliateButton>`, double opt-in                                         | Redirections testées, mentions présentes         |
| 8. SEO + légal         | Sitemap, JSON-LD, pages légales, `/methode`, `/transparence`                       | Données structurées valides, zéro title dupliqué |
| 9. Déploiement         | Netlify, README, MAINTENANCE.md, `check-links.ts`                                  | URL de production, checklist cochée              |

Pages métier pilotes proposées pour la Phase 3 (1 par famille) : plombier, infirmier libéral, fleuriste, coiffeur, avocat, serrurier, développeur freelance, VTC, restaurateur, maraîcher.
