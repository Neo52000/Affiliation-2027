# PLAN.md — Phase 0 : plan du site « facturation électronique par métier »

Date : 2026-10-04 · Statut : **en attente de validation humaine** (gate imposée par la spécification, section 13)

## 1. Objet

Site statique Astro en français aidant TPE, artisans, professions libérales et micro-entrepreneurs à choisir leur logiciel de facturation électronique et leur compte pro, monétisé par affiliation. Objectif build : 100 pages métier indexables, 3 outils interactifs, Lighthouse ≥ 95 sur les 4 axes.

Positionnement non négociable : angle par **métier** (pas par statut), classement **indépendant des commissions** (méthode publique `/methode`), **tests réels** documentés (fiches `statut: a_tester`, jamais de résultat inventé), données **datées et sourcées**.

## 2. Arborescence du site

| Route | Volume | Rôle |
|---|---|---|
| `/` | 1 | Quiz au-dessus de la ligne de flottaison, 3 preuves de confiance, accès par famille |
| `/facturation-electronique/{metier}` | 100 | Pages métier (gabarit section 6 de la spec) |
| `/metiers/{famille}` | 10 | Hubs famille |
| `/logiciels/{outil}` | 6 → 12 | Fiches outil |
| `/comparatif/{a}-vs-{b}` | 15 | Toutes les paires des 6 outils principaux |
| `/guides/{slug}` | 10 | Guides piliers (1 200–2 000 mots, sourcés) |
| `/outils/quiz`, `/outils/echeance`, `/outils/verificateur-facture` | 3 | Îlots interactifs (Preact), dégradation sans JS |
| `/plateformes-agreees` | 1 | Tableau filtrable de la liste officielle DGFiP, date de relevé visible |
| `/methode`, `/a-propos`, `/transparence` | 3 | Confiance |
| `/mentions-legales`, `/confidentialite` | 2 | Légal (LCEN, RGPD) |
| `/go/{slug}` | 6 | Redirections 302 affiliées (netlify.toml), exclues de robots.txt |

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
| Métier | Slug | Spécificité de facturation dominante |
|---|---|---|
| Plombier | `plombier` | Acomptes, TVA 10 %/5,5 % rénovation, dépannage urgence |
| Électricien | `electricien` | Attestation TVA réduite, autoliquidation en sous-traitance |
| Maçon | `macon` | Situations de travaux, retenue de garantie |
| Couvreur | `couvreur` | TVA réduite rénovation, acomptes |
| Chauffagiste | `chauffagiste` | TVA 5,5 % rénovation énergétique, contrats d'entretien |
| Menuisier | `menuisier` | Fourniture + pose, acomptes sur-mesure |
| Peintre en bâtiment | `peintre-batiment` | Devis détaillés, TVA réduite |
| Carreleur | `carreleur` | Situations de travaux, sous-traitance |
| Plaquiste | `plaquiste` | Autoliquidation TVA sous-traitance BTP |
| Paysagiste | `paysagiste` | TVA selon nature des travaux, contrats d'entretien |

### Santé
| Métier | Slug | Spécificité |
|---|---|---|
| Infirmier libéral | `infirmier-liberal` | Exonération TVA, tiers payant, rétrocessions |
| Kinésithérapeute | `kinesitherapeute` | Exonération TVA, tiers payant |
| Ostéopathe | `osteopathe` | Exonération TVA, notes d'honoraires B2C |
| Sage-femme | `sage-femme` | Exonération TVA, conventionnement |
| Orthophoniste | `orthophoniste` | Exonération TVA, tiers payant |
| Pédicure-podologue | `pedicure-podologue` | Actes exonérés vs semelles (TVA mixte) |
| Psychologue | `psychologue` | Exonération conditionnelle |
| Diététicien | `dieteticien` | Exonération conditionnelle, forfaits |
| Chirurgien-dentiste | `chirurgien-dentiste` | Soins exonérés vs prothèses |
| Vétérinaire | `veterinaire` | TVA 20 %, actes + médicaments, clientèle mixte |

### Commerce
| Métier | Slug | Spécificité |
|---|---|---|
| Fleuriste | `fleuriste` | TVA multi-taux, prestations événements |
| Caviste | `caviste` | Droits d'accise, B2B CHR |
| Boucher-charcutier | `boucher-charcutier` | TVA 5,5 %/10 %, tickets + B2B |
| Épicerie fine | `epicerie-fine` | TVA multi-taux, paniers cadeaux B2B |
| Opticien | `opticien` | Part LPP + part libre, tiers payant mutuelles |
| Libraire-papetier | `libraire-papetier` | TVA livre 5,5 %, prix unique, marchés scolaires |
| E-commerçant | `e-commercant` | Ventes à distance UE (OSS), facturation automatisée |
| Brocanteur-antiquaire | `brocanteur-antiquaire` | TVA sur marge, livre de police |
| Bijoutier | `bijoutier` | TVA sur marge occasion, métaux précieux |
| Prêt-à-porter | `pret-a-porter` | Soldes, avoirs et retours |

### Services
| Métier | Slug | Spécificité |
|---|---|---|
| Coiffeur | `coiffeur` | Tickets B2C, franchise en base fréquente |
| Esthéticienne | `estheticienne` | Forfaits/cures, acomptes de réservation |
| Photographe | `photographe` | Cession de droits vs prestation, acomptes mariage |
| Garagiste | `garagiste` | Pièces + main-d'œuvre, créances assureurs |
| Agent immobilier | `agent-immobilier` | Honoraires loi Hoguet, mandats |
| Formateur | `formateur` | Exonération TVA formation, BPF, conventions |
| Auto-école | `auto-ecole` | Forfaits CPF, échéanciers élèves |
| Entreprise de nettoyage | `entreprise-nettoyage` | Contrats récurrents, facturation mensuelle |
| Aide à domicile | `aide-a-domicile` | SAP, avance immédiate crédit d'impôt, attestation fiscale |
| Organisateur d'événements | `organisateur-evenements` | Acomptes, débours, multi-prestataires |

### Libéral
| Métier | Slug | Spécificité |
|---|---|---|
| Avocat | `avocat` | Honoraires + débours, aide juridictionnelle |
| Expert-comptable | `expert-comptable` | Lettres de mission, honoraires récurrents |
| Architecte | `architecte` | Honoraires par phases, acomptes |
| Notaire | `notaire` | Émoluments réglementés, débours |
| Commissaire de justice | `commissaire-de-justice` | Tarifs réglementés, débours |
| Géomètre-expert | `geometre-expert` | Marchés publics |
| Consultant | `consultant` | TJM, acomptes, autoliquidation UE |
| Traducteur-interprète | `traducteur` | Clients étrangers, TVA intracommunautaire |
| Conseiller en gestion de patrimoine | `conseiller-gestion-patrimoine` | Honoraires vs rétrocessions |
| Diagnostiqueur immobilier | `diagnostiqueur-immobilier` | Rapports normés, B2B/B2C |

### Artisanat
| Métier | Slug | Spécificité |
|---|---|---|
| Ébéniste | `ebeniste` | Sur-mesure, acomptes |
| Tapissier d'ameublement | `tapissier` | Fourniture + façon |
| Cordonnier | `cordonnier` | Tickets B2C, multiservices, franchise en base |
| Céramiste | `ceramiste` | Vente directe, dépôt-vente, marchés |
| Créateur de bijoux | `createur-bijoux` | Vente en ligne + marchés |
| Couturière-retoucheuse | `couturiere` | Retouches B2C, franchise en base |
| Ferronnier | `ferronnier` | Sur-mesure bâtiment, pose |
| Serrurier | `serrurier` | Dépannage urgence (encadrement des devis) |
| Horloger-réparateur | `horloger` | Réparation + vente de pièces |
| Toiletteur | `toiletteur` | Tickets B2C, abonnements |

### Numérique
| Métier | Slug | Spécificité |
|---|---|---|
| Développeur freelance | `developpeur-freelance` | TJM, clients UE/hors UE, autoliquidation |
| Graphiste | `graphiste` | Cession de droits d'auteur, acomptes |
| UX/UI designer | `ux-designer` | Forfaits projet, clients étrangers |
| Rédacteur web | `redacteur-web` | Droits d'auteur vs prestation |
| Community manager | `community-manager` | Abonnements mensuels |
| Consultant SEO | `consultant-seo` | Abonnements + missions one-shot |
| Data analyst | `data-analyst` | TJM, missions longues |
| Motion designer | `motion-designer` | Cession de droits, acomptes |
| Dépanneur informatique | `depanneur-informatique` | Interventions B2C/B2B, forfaits + régie |
| Créateur de formations en ligne | `formateur-en-ligne` | TVA formation vs produit numérique |

### Transport
| Métier | Slug | Spécificité |
|---|---|---|
| Taxi | `taxi` | Conventionnement CPAM, tarifs réglementés |
| VTC | `vtc` | Plateformes et autofacturation, TVA 10 % |
| Transporteur routier | `transporteur-routier` | Lettre de voiture, B2B, gazole professionnel |
| Chauffeur-livreur | `chauffeur-livreur` | Sous-traitance messagerie, autofacturation |
| Coursier à vélo | `coursier-velo` | Plateformes, micro-entreprise |
| Ambulancier | `ambulancier` | Conventionnement sécurité sociale, tiers payant |
| Déménageur | `demenageur` | Devis obligatoire, acomptes |
| Autocariste | `autocariste` | TVA 10 %, marchés scolaires et publics |
| Dépanneur-remorqueur auto | `depanneur-auto` | Tarifs réglementés autoroute, assureurs |
| Transport de personnes à mobilité réduite | `tpmr` | Conventionnement, marchés publics |

### Restauration
| Métier | Slug | Spécificité |
|---|---|---|
| Restaurateur | `restaurateur` | TVA 10 %/5,5 %/20 % selon consommation |
| Traiteur | `traiteur` | Devis événements, acomptes, TVA multi-taux |
| Food truck | `food-truck` | Vente à emporter, emplacements |
| Pizzeria | `pizzeria` | TVA mixte livraison/sur place |
| Crêperie | `creperie` | TVA mixte, saisonnalité |
| Bar-brasserie | `bar-brasserie` | TVA 20 % alcools, licence |
| Chef à domicile | `chef-a-domicile` | Prestation + denrées |
| Boulanger | `boulanger` | TVA 5,5 %, tickets + B2B restaurants |
| Pâtissier | `patissier` | Commandes événements, acomptes |
| Glacier | `glacier` | Saisonnalité, TVA selon consommation |

### Agriculture
| Métier | Slug | Spécificité |
|---|---|---|
| Agriculteur (grandes cultures) | `agriculteur` | TVA agricole, remboursement forfaitaire, coopératives |
| Maraîcher | `maraicher` | Vente directe, AMAP, marchés |
| Viticulteur | `viticulteur` | Droits d'accise, DRM, export |
| Éleveur bovin | `eleveur-bovin` | Ventes en coopérative, TVA agricole |
| Apiculteur | `apiculteur` | Vente directe, micro-BA |
| Horticulteur-pépiniériste | `horticulteur` | TVA multi-taux plants/fleurs |
| Arboriculteur | `arboriculteur` | Saisonnalité, coopératives |
| Conchyliculteur | `conchyliculteur` | Vente directe + mareyage |
| Entrepreneur de travaux agricoles | `entrepreneur-travaux-agricoles` | Prestations inter-exploitations |
| Fromager fermier | `fromager-fermier` | Vente directe, normes sanitaires |

## 5. Outils couverts

**6 outils du lancement** (programmes d'affiliation visés par la spec) : Tiime, Qonto, Pennylane, Abby, Indy, Shine. Fiches créées en Phase 2 avec données 100 % sourcées (prix HT, date de relevé, URL source) et `statut_test: a_tester`.

**6 candidats pour atteindre les 12 fiches visées** (à évaluer en Phase 2, aucun engagement) : Axonaut, Sellsy, Evoliz, Henrri, Freebe, Blank. Critères d'inclusion : pertinence TPE/indépendants, statut vis-à-vis de la réforme, données tarifaires publiques vérifiables.

Rappel : les commissions ne s'affichent jamais et n'entrent jamais dans la notation (pondération publique : conformité 25 %, prix 12 mois 20 %, simplicité 20 %, fonctionnalités métier 20 %, support 10 %, pérennité 5 % ; note `null` + « Test en cours » tant que `statut_test = a_tester`).

## 6. Sources officielles relevées

_(Section en cours de remplissage — recherche en parallèle.)_

## 7. Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| **Calendrier réglementaire mouvant** (reports déjà survenus dans l'historique de la réforme) | Contenu obsolète, perte de confiance | Dates uniquement dans `echeances.json` (source unique), bandeau date de relevé, routine mensuelle `MAINTENANCE.md`, aucune date en dur dans les gabarits |
| **Duplication de contenu programmatique** (100 pages sur un même sujet) | Pénalité qualité Google | Règle bloquante ≥ 50 % de texte propre, `check-similarity.ts` (Jaccard > 0,5 = build FAIL), exemples de facture et FAQ réellement spécifiques par métier |
| **Dépendance aux 6 programmes d'affiliation** | Revenu nul si un programme ferme | Candidats de réserve (section 5), bouton bascule automatique vers URL officielle si lien affilié absent |
| **YMYL / E-E-A-T** : sujet fiscal sans auteur identifié | Déclassement SEO | Bloc auteur + relecteur (EXPERT_RELECTEUR), méthode publique, sources officielles liées sur chaque affirmation, encart « ne remplace pas votre expert-comptable » |
| **Variables légales non renseignées** (EDITEUR_LEGAL…) | Mise en ligne non conforme LCEN | Bloquant tracé dans `TODO.md` ; le déploiement Phase 9 exige ces valeurs |
| **Budget perf** (JS < 30 ko hors outils, LCP < 1,5 s) | Échec critère Lighthouse ≥ 95 | Sortie 100 % statique, îlots Preact uniquement sur les 3 outils, polices auto-hébergées 2 graisses, audit à chaque phase |
| **Fiches de test non remplies** (l'éditeur humain doit tester) | Notes `null` durables, pages moins convaincantes | Affichage « Test en cours » assumé, structure de fiche prête, relance dans `TODO.md` |

## 8. Décisions prises hors spécification

1. Variables section 0 toutes absentes → placeholders `TODO_xxx` + tableau d'impact dans `TODO.md` (règle de la spec appliquée, aucun blocage).
2. Dépôt distant vide → création d'une branche `main` de base (bootstrap) pour permettre la PR de la branche de travail `claude/new-session-3pcm2s`.
3. Le relevé exhaustif prix/fonctionnalités par outil est reporté à la Phase 2 (la spec ne l'exige qu'en Phase 2) ; la Phase 0 relève le calendrier, la liste PA, les URLs officielles et l'existence des programmes d'affiliation.
4. 15 comparatifs (paires des 6 outils) : C(6,2) = 15, conforme à « toutes les paires ».

## 9. Déroulé des phases suivantes

| Phase | Livrable | Critère d'acceptation |
|---|---|---|
| 1. Socle | Astro + Tailwind + TS strict, design system, layout, netlify.toml, CI | Build vert, Lighthouse ≥ 95 sur page vide |
| 2. Données | Schémas Zod, 6 fiches outil sourcées, `echeances.json`, `plateformes-agreees.json` | Zéro donnée sans source ni date |
| 3. Pilotes | 10 pages métier, 1 hub, 1 comparatif, 1 fiche outil | **Validation humaine** |
| 4. Échelle | 100 pages métier, 10 hubs, 15 comparatifs | `check-similarity.ts` vert |
| 5. Guides | 10 guides piliers | Chaque affirmation sourcée |
| 6. Outils | Quiz, simulateur échéance, vérificateur facture | Vitest (20 cas quiz) + Playwright verts |
| 7. Affiliation + email | `/go/`, `<AffiliateButton>`, double opt-in | Redirections testées, mentions présentes |
| 8. SEO + légal | Sitemap, JSON-LD, pages légales, `/methode`, `/transparence` | Données structurées valides, zéro title dupliqué |
| 9. Déploiement | Netlify, README, MAINTENANCE.md, `check-links.ts` | URL de production, checklist cochée |

Pages métier pilotes proposées pour la Phase 3 (1 par famille) : plombier, infirmier libéral, fleuriste, coiffeur, avocat, serrurier, développeur freelance, VTC, restaurateur, maraîcher.
