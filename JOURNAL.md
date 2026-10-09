# JOURNAL

## Phase 0 — Plan (2026-10-04)

PLAN.md livré : arborescence (151 pages), 100 métiers (10 familles, slugs uniques vérifiés), 6 outils + 6 candidats, risques.
Recherche par 9 agents parallèles + 1 critique : calendrier confirmé sur sources .gouv.fr (réception tous + émission GE/ETI 01/09/2026 en vigueur ; émission PME/TPE/micro 01/09/2027 ; e-reporting aligné).
Terminologie officielle « plateforme agréée » confirmée ; les 6 outils figurent au registre DGFiP ; programmes d'affiliation tous confirmés (Affilae ×4, Qonto direct/Awin, Shine à reconfirmer).
Limite : proxy réseau bloquant les fetchs directs (.gouv.fr, éditeurs) — vérifications via extraits indexés restreints aux domaines officiels ; non-publiables tracés dans TODO.md (#8-16).
Variables section 0 absentes → placeholders TODO_xxx (TODO.md #1-7). Décision : branche `main` créée pour permettre les PR (dépôt distant vide).
PLAN.md validé par l'humain le 2026-10-04 (PR #1 fusionnée).

## Phase 1 — Socle (2026-10-04)

Projet Astro 7.3.5 statique, TypeScript strictest, Tailwind CSS 4 (plugin Vite), pnpm, Node 22.
Design system : tokens CSS (accent unique #1d4ed8, corps 18 px, 70ch, focus visible, skip-link), Inter auto-hébergée 2 graisses (@fontsource), layout Base + Header/Footer/Breadcrumb/Seo, pages / et 404.
Outillage : ESLint 10 (flat, plugin astro + jsx-a11y), Prettier, Vitest (9 tests verts sur src/lib/seo), astro check 0 erreur, CI GitHub Actions (check/lint/format/test/build).
netlify.toml : build, en-têtes de sécurité (CSP, HSTS…), cache immutable /_astro, emplacement réservé aux redirections /go/ (Phase 7).
Dépendances ajoutées (justification) : esbuild autorisé en postinstall (binaire requis par Vite/Astro) ; @fontsource/inter (polices auto-hébergées imposées).
Build vert (2 pages). Lighthouse local (Chromium headless, accueil) : perf 100, accessibilité 100, bonnes pratiques 100, SEO 100 — LCP 0,8 s, CLS 0, 52 KiB transférés, zéro JS. Critère « ≥ 95 sur les 4 axes » atteint.

## Phase 2 — Données (2026-10-04)

Schémas Zod complets (`src/lib/schemas.ts`) : outil, métier, fiche de test, guide, échéances, plateformes agréées, affiliation ; règles encodées (note finale null si a_tester, prix non null ⇒ date + URL obligatoires).
Collections Astro `outils` et `tests` actives (metiers en Phase 3, guides en Phase 5). Décision : fichiers JSON plutôt que YAML (loader glob natif, zéro dépendance ajoutée).
`echeances.json` : 5 échéances, chacune avec ≥ 1 source .gouv.fr ; base légale (5 textes Légifrance) ; tolérance 2026 sourcée.
`plateformes-agreees.json` : registre complet (165 entrées : 149 définitives + 16 en attente) transcrit depuis la copie tierce du registre DGFiP (data.gouv.fr, relue 07/09/2026), provenance et avertissement dans le fichier — à re-vérifier sur impots.gouv.fr (TODO #8-10).
Décision : dates d'immatriculation à null dans les 6 fiches outil tant que non confirmées sur la liste officielle ; prix non relevés (sites éditeurs bloqués par le proxy) → plans vides + TODO #13.
6 fiches outil sourcées (statut PA, cible, URLs tarifs/affiliation) + 6 fiches de test `a_tester` avec protocole en 6 points.
19 tests Vitest verts (validation Zod de toutes les données + règles métier). Dépendance ajoutée : @types/node (tests Node ESM).

## Phase 3 — Gabarits + 10 pages métier pilotes (2026-10-05)

Gabarits : page métier (ordre imposé section 6, dates lues dans echeances.json, jamais en dur), hub famille (bâtiment), comparatif tiime-vs-qonto (verdicts fondés sur les seuls faits vérifiés), fiches outil, AffiliateButton (bascule URL officielle, lien affilié signalé + bandeau transparence quand actif).
Contenus : 10 métiers rédigés par agents (recherche restreinte aux domaines officiels), puis VÉRIFIÉS adversarialement (3 affirmations à risque contre-vérifiées par métier) et corrigés — 3 bloquants détectés et corrigés (devis plomberie obligatoire sans seuil, arrêté du 24/01/2017 ; autofacturation VTC ; +1), 0 bloquant résiduel. Interruption par limite de session le 04/10 au soir, reprise par cache le 05/10 (aucun re-travail).
Garde-fous : check-similarity 10 pages = max 14,7 % (seuil 50 %) ; check-seo 19 pages indexables OK ; 32 tests ; build 20 pages.
Lighthouse page plombier : 100/100/100/100, LCP 1,2 s, CLS 0 (corrections : soulignement des liens rétabli — préflight Tailwind —, préchargement des 2 woff2 Inter).
Arrêt pour validation humaine de la qualité des pilotes avant mise à l'échelle (section 13).

## Phase 4 (partie code) — 2026-10-05

Validation humaine des pilotes reçue (PR #2 fusionnée + go explicite). 15 comparatifs ouverts (toutes les paires des 6 outils), hubs famille pilotés par src/data/hubs.json. Les 90 contenus métier et 9 intros de hub sont produits par workflow (briefs famille sourcés → lots de 3 → vérification adversariale → correction) — en cours.
Netlify connecté par l'éditeur : Deploy Preview actif sur chaque PR.

## Phase 6 — Outils interactifs (2026-10-06, en parallèle de la génération Phase 4)

Décision : la Phase 6 (pur code) a été construite pendant la génération des contenus Phase 4 ; la Phase 5 (guides) suit. Îlots Preact uniquement sur les 3 pages outils (accueil : zéro script, ~26 ko JS sur pages outils).
Quiz : fonction pure recommander() — entrées métier/statut/volume/compte pro/expert-comptable, jamais la commission ; 20 cas Vitest ; autocomplétion par datalist ; recommandations alignées sur les trios des pages métier.
Simulateur d'échéance : situerEcheances() lit echeances.json (aucune date en dur), franchise en base traitée, non-assujetti = message prudent ; calendrier complet statique sous l'îlot (dégradation sans JS).
Vérificateur de facture : 27 mentions relevées sur sources officielles (agent dédié, 4 nouvelles mentions de la réforme corroborées par 2 sources, 3 non vérifiées tracées dans le fichier) ; traitement 100 % navigateur ; liste statique en noscript.
Dépendances ajoutées : preact + @astrojs/preact (îlots imposés par la spec), @playwright/test (5 parcours imposés — 6 écrits, verts en local via Chromium préinstallé ; étape CI ajoutée).
65 tests Vitest + 6 parcours Playwright verts ; build 37 pages.

## Phase 7 — Affiliation + capture email (2026-10-06)

Redirections /go/ : bloc de netlify.toml généré au prebuild depuis affiliation.json (302 force, triées, idempotent, testé) — 0 active tant que LIENS_AFFILIES est vide (TODO #6), bascule URL officielle déjà en place dans AffiliateButton. Attribut data-emplacement posé sur chaque bouton ; événement analytics branché quand l'analytics sans cookie sera activé (option désactivée par défaut, section 4).
Capture email (section 12) : fonction Netlify rappel-email (double opt-in via le fournisseur, prête pour Brevo), validation pure testée (consentement explicite exigé, case jamais précochée), formulaire sur /outils/echeance (métier facultatif) — répond « pas encore activé » tant que EMAIL_API_KEY/TEMPLATE/LISTE ne sont pas posées dans Netlify (TODO #7). Clé uniquement en variable d'environnement.
74 tests Vitest + 6 parcours Playwright verts.

## Phase 8 — SEO technique + légal + confiance (2026-10-06)

JSON-LD : Organization + WebSite sur toutes les pages (Seo.astro), BreadcrumbList partout (Breadcrumb.astro), FAQPage sur les pages métier, SoftwareApplication sans AggregateRating sur les fiches outil. Sitemap segmenté (@astrojs/sitemap) + ligne Sitemap dans robots.txt (domaine placeholder, TODO #2).
Pages : /methode (pondérations publiques + protocole de test), /transparence (financement, règles d'affichage des liens affiliés), /a-propos, /mentions-legales (placeholders TODO_EDITEUR_LEGAL, page noindex tant que non conforme LCEN — TODO #3), /confidentialite (RGPD : seul l'email du formulaire de rappel est collecté, double opt-in), /plateformes-agreees (165 PA, provenance affichée, filtre JS natif léger — décision : « tableau filtrable » de la section 6 l'emporte, dégradation = tableau complet).
Footer 3 colonnes + navigation header (Quiz, Plateformes agréées, Méthode). Design system v2 appliqué sur main entre-temps (thème sombre, mouvements) conservé tel quel.
Build 43 pages, garde-fous verts, 74 tests + 6 parcours e2e.

## Design v3 « conversion » (2026-10-05)

Décision (hors spec, demande utilisateur) : le style sobre de la section 10 est remplacé par une identité plus vendeuse — dégradé bleu→violet (titres, CTA, liserés de cartes), hero avec halo, tuiles de chiffres clés réels (jamais inventés : métiers, 165 PA, outils), badges verts « Plateforme agréée » / « Notre recommandation », encadré « essentiel » accentué. AA conservé : paires de contraste recalculées clair/sombre, boutons dégradés en blanc gras (AA large).
Accueil réécrit orienté conversion : promesse métier, double CTA (quiz / échéances), preuves, bande CTA finale. Header : bouton « Trouver mon logiciel ».
Correctif WCAG 1.4.1 : le survol des liens renforce le soulignement au lieu de foncer la couleur (axe évalue l'état hover ; 2,35:1 < 3:1).
Lighthouse : accueil 100/100/100/100 (LCP 0,8 s, CLS 0) ; plombier 100/100/100/100 (CLS 0). 74 tests Vitest + 6 parcours e2e verts ; garde-fous similarité/SEO verts.

## Illustrations et images (2026-10-06)

Demande utilisateur : « cela manque d'images ». Choix : SVG inline uniquement (zéro requête, net en Retina, couleurs par variables CSS donc thème sombre automatique) — aucune photo stock ni visuel inventé ; les captures réelles des outils viendront des tests documentés et les logos éditeurs attendent les kits presse (TODO #17).
Livré : illustration du hero (facture → plateforme agréée → destinataire), 10 pictogrammes de familles de métiers (accueil + hubs), pictos étapes/preuves/outils, favicon aligné sur l'identité dégradé, image Open Graph 1200×630 générée par capture Chromium (og.png) + balises og:image/twitter:card.
Lighthouse accueil et plombier : 100/100/100/100, CLS 0, LCP 1,4 s. 74 tests + 6 e2e verts, garde-fous OK.

## Phase 4 (hubs) — 10 familles publiées (2026-10-06)

Les 10 introductions de hub famille (produites par les agents « brief famille » du workflow Phase 4, sur recherche sourcée mutualisée) sont importées : 9 nouvelles pages famille s'ouvrent, chacune listant ses métiers publiés. L'intro bâtiment provisoire est remplacée par la version complète.
Gabarit de hub : pictogramme de famille en tête, et renvoi à la source officielle du calendrier + date de relevé en pied — l'intro décrit la réforme, elle doit donc être sourcée comme les pages métier. Aucune date réglementaire en dur (formulation « à l'échéance applicable à votre entreprise »).
Nouveau helper testé familleTitle() : variantes successives sous la limite de 60 caractères, réduction d'un libellé composé à sa tête (« Restauration et métiers de bouche » → « Restauration ») ; le H1 et le fil d'Ariane gardent le libellé complet.
Build 52 pages, check-seo 49 pages indexables OK, similarité OK, 77 tests Vitest + 6 parcours e2e verts.
État des contenus métier : 18 vérifiés et prêts, 60 rédigés en attente de vérification adversariale, 12 à rédiger — le workflow reprend sur son cache après chaque interruption de limite de session.

## Phase 4 (vague 1) — 18 métiers bâtiment et santé publiés (2026-10-06)

Import des 18 premiers contenus métier vérifiés : familles bâtiment (électricien, maçon, couvreur, chauffagiste, menuisier, peintre, carreleur, plaquiste, paysagiste) et santé (kinésithérapeute, ostéopathe, sage-femme, orthophoniste, pédicure-podologue, psychologue, diététicien, chirurgien-dentiste, vétérinaire). 28 pages métier en ligne.
La vérification adversariale a rapporté son premier bloquant utile : un taux de TVA faux sur le paysagiste (petits travaux de jardinage en services à la personne annoncés à 10 % au lieu du taux normal de 20 %, exclus des taux réduits depuis 2013) — corrigé en deux endroits avant publication. Aucune date de la réforme en dur dans les 18 contenus.
Décision (outillage) : le workflow Phase 4 d'origine ne converge pas — les agents imbriqués dans un parallel() au sein d'une étape de pipeline() reçoivent des clés de cache instables, donc chaque reprise refait les rédactions et épuise la limite de session avant d'atteindre les vérifications. Remplacé par un workflow de vérification à clés stables (pipeline de premier niveau, un agent par lot) qui lit les contenus sur disque et y écrit rapports et corrections ; un assembleur reconstruit l'import depuis le journal + ces fichiers, donc toute interruption ne coûte plus que les agents restants.
Garde-fous : 70 pages construites, 378 paires comparées, similarité maximale 16,2 % (seuil 50 %), check-seo 67 pages indexables conformes, 77 tests + 6 parcours e2e verts, Lighthouse page vétérinaire 100/100/100/100 (CLS 0).

## Design v4 — lisibilité des pages longues (2026-10-06)

Demande utilisateur : améliorer encore le design. Diagnostic sur captures : les pages longues (métier, fiche outil) perdaient 40 % de la largeur à droite, les tableaux de fonctionnalités s'ancraient sur des « Oui / À vérifier » en texte brut illisibles en balayage, le comparatif n'opposait visuellement rien, les montants de l'exemple de facture se coupaient en deux lignes et le bouton d'appel de l'en-tête cassait sur mobile.
Colonne d'appui collante (≥ lg) sur les pages métier et les fiches outil : sommaire ancré de la page, rappel d'échéance lu dans echeances.json, carte d'appel à l'action. Sous lg, elle passe simplement sous l'article — aucun JavaScript ajouté.
Composant Statut : icône + libellé (jamais la couleur seule, WCAG 1.4.1) pour les fonctionnalités, sur les fiches outil et les tableaux comparatifs. Comparatif : les deux outils face à face (monogramme, cible, badge d'agrément) et verdicts en grille à deux colonnes.
Détails : titres de section soulignés d'un filet dégradé, colonnes numériques de l'exemple de facture insécables et alignées à droite, doublons retirés sur la fiche outil, bouton d'en-tête tenant sur une ligne sous 480 px.
Garde-fous : 70 pages, similarité maximale 16,6 % (le sommaire répété ajoute 0,4 point, seuil 50 %), check-seo 67 pages conformes, 77 tests + 6 parcours e2e verts, Lighthouse 100/100/100/100 et CLS 0 sur les trois gabarits retouchés, rendu vérifié en thème clair et sombre.

## Phase 4 (vague 2) — 61 métiers publiés (2026-10-06)

33 nouveaux contenus métier importés après vérification adversariale et correction : artisanat, commerce, professions libérales, numérique, transport, services, plus le lot restauration-lot2 (crêperie, bar-brasserie, chef à domicile) rédigé par le second workflow. 61 pages métier sur 100.
Schéma assoupli sur trois cas que les rédacteurs ont traités correctement et que le schéma refusait : montant négatif pour une ligne d'acompte déduit, montant null pour un émolument au tarif réglementé non reproduit, taux de TVA null en franchise en base ou pour un débours. Le composant ExempleFacture rend ces cas sans mentir : « — » en colonne TVA avec sa légende, pas de total TTC quand la TVA est hors champ, aucun total quand un montant manque.
Décision : ne jamais écrire « TVA 0 % » en franchise en base — un taux affiché, fût-il nul, rendrait l'entreprise redevable de la taxe (mention relevée par le correcteur sur la fiche chef à domicile).
Incident d'outillage : le rédacteur du lot agriculture-lot3 a inventé sa propre structure, ma consigne décrivant le fichier de sortie sans énumérer les champs. Relancé sur un workflow dédié où le schéma est imposé par l'outil de réponse, pas par la consigne.
TODO #18 ouvert : un vérificateur n'a pas retrouvé Indy sur la liste officielle des plateformes agréées, alors que les cinq autres outils y figurent — à revérifier à la source avant toute exploitation commerciale.
Garde-fous : 103 pages construites, 1830 paires comparées, similarité maximale 20,7 % (seuil 50 %), check-seo 100 pages indexables conformes, 77 tests + 6 parcours e2e verts.

## Design v5 — outils, méthode et registre (2026-10-06)

Les trois pages d'outils interactifs portaient encore des styles bruts antérieurs au système : champs sans états, boutons radio par défaut, et un bouton principal en aplat bleu là où tout le site utilise le dégradé. Les quatre îlots Preact sont alignés sur les classes du système (champ, choix, btn-cta, card-top).
Page quiz, cœur de la conversion : formulaire dans une carte à liseré, choix oui/non en pastilles de 44 px avec état sélectionné lisible (le bouton radio reste visible, la couleur ne porte pas seule l'information), et colonne d'appui qui répond aux objections réelles — comment la recommandation est calculée, pourquoi aucune note n'est encore publiée, où simuler son échéance.
Page méthode : la pondération des critères devient une jauge par ligne, le pourcentage restant écrit en toutes lettres — l'indépendance du classement se lit d'un coup d'œil.
Page des plateformes agréées : correction d'un vrai défaut, deux espaces manquants collaient le texte aux liens de provenance (« republiée surdata.gouv.fr ») ; statuts en badges plutôt qu'en texte répété 149 fois ; en-tête de tableau collant au défilement.
Correctif de test : le garde-fou d'hydratation e2e exigeait que tous les îlots d'une page soient hydratés, ce qui contredit l'intérêt d'un îlot client:visible. Il cible désormais le seul îlot contenant le contrôle manipulé — le test cassait parce que la page avait grandi, pas parce qu'elle était cassée.
Lighthouse 100/100/100/100 et CLS 0 sur les trois pages retouchées ; 77 tests + 6 parcours e2e verts ; similarité et SEO inchangés.

## Design v6 — revue critique contradictoire et correctifs mesurés (2026-10-06)

Trois constats d'un panel de revue ont été vérifiés avant d'être corrigés, et deux autres rejetés faute de preuve.
Pages comparatives orphelines : `grep -rl 'href="/comparatif/'` sur le build ne renvoyait aucune page métier. Les 15 comparatifs n'étaient atteignables que depuis l'accueil. Chaque page métier expose désormais les paires de ses trois outils recommandés, dans un ordre d'outil stable pour ne jamais produire d'URL inexistante — 3 liens par page, 61 pages, cibles vérifiées en HTTP 200.
Bordures sous le seuil : `--color-border` #d0d7de donne 1,45:1 sur blanc, 1,49:1 en thème sombre, là où WCAG 1.4.11 impose 3:1 pour la limite d'un composant d'interface — ce que Lighthouse ne contrôle pas. Nouveau jeton `--color-border-strong` à 4,55:1 (clair) et 5,07:1 (sombre), appliqué aux champs, aux pastilles de choix et au bouton secondaire, mesuré dans le navigateur.
Ligne de lecture trop longue : `prose-measure` à 70ch rendait 86 caractères par ligne, l'unité ch valant l'avance du glyphe « 0 », nettement plus large qu'un caractère moyen en Inter. Ramenée à 54ch, soit 71 caractères mesurés, dans la plage de confort 45-75.
Détails : ancres décalées de 5,5 rem sous l'en-tête collant, listes à puces aérées et puces accentuées, tuiles de chiffres de l'accueil lisibles sous 400 px, et un appel au quiz au milieu de la page métier — sur mobile la colonne d'appui tombe à 7 969 px du haut d'une page qui en fait 8 697, le lecteur n'y arrive jamais.
Garde-fous : 103 pages, similarité maximale 20,7 % (seuil 50 %), check-seo 100 pages indexables, 77 tests + 6 parcours e2e verts, Lighthouse 100/100/100/100 et CLS 0.

## Phase 4 (vague 3) — 88 métiers publiés (2026-10-06)

27 contenus métier importés : les 9 lots dont la correction était écrite sur disque mais jamais reprise par l'assembleur après l'assouplissement du schéma — professions libérales, numérique (3 lots), restauration (2 lots), services (3 lots). Huit familles sur dix sont complètes à 10 métiers sur 10.
L'assembleur proposait aussi de réécrire 21 fiches déjà publiées. Vérification faite, 15 différences ne portaient que sur la mise en forme et 6 sur des reformulations équivalentes — aucune correction de fond. Écrasées, elles auraient produit du bruit de revue sans bénéfice pour le lecteur : les fiches publiées sont restées intactes.
Reste 12 métiers pour atteindre 100 : les 9 du transport, dont les rédactions et les rapports de vérification existent mais dont les trois agents correcteurs ont échoué avant d'écrire, et les 3 de l'agriculture-lot3, dont le contenu corrigé est hors schéma.
Garde-fous : 130 pages construites, 3 828 paires comparées, similarité maximale 20,7 % (seuil 50 %), check-seo 127 pages indexables conformes, 77 tests + 6 parcours e2e verts.

## Phase 4 terminée — 100 métiers, et correction d'un défaut d'affichage mobile généralisé (2026-10-06)

Les 12 derniers contenus sont publiés : 9 pour le transport, dont les correcteurs avaient échoué avant d'écrire, et 3 pour l'agriculture, dont le contenu vérifié était hors schéma. **100 métiers sur 100, dix familles complètes.** Le contrat de sortie donné aux agents énumérait cette fois chaque champ et chaque type ; une seule divergence est restée, sur `mentions_obligatoires_specifiques` que j'avais décrit comme une liste d'objets alors que le schéma attend des chaînes. Les 30 URLs portées par ces objets étaient déjà toutes présentes dans `sources[]` — vérifié avant d'aplatir, donc rien de perdu.

Défaut d'affichage trouvé en vérifiant le nouveau hub : **toutes les pages débordaient horizontalement sur un téléphone de 360 px**, jusqu'à 170 px sur la page métier. Trois causes distinctes, toutes mesurées dans le navigateur :

- `.layout-article` laissait sa piste de grille en `auto`, qui se dimensionne sur le min-content du contenu : un tableau de 474 px poussait toute la page au lieu de défiler dans son `.table-scroll`. `minmax(0, 1fr)` autorise la piste à descendre sous le min-content.
- `.duel` était en `1fr auto 1fr` à toutes les largeurs. `1fr` vaut `minmax(auto, 1fr)`, dont le minimum est le min-content : les deux fiches de comparatif poussaient la page. Elles s'empilent désormais sous 640 px.
- `.badge-ok` portait `white-space: nowrap`, utile pour « Plateforme agréée », ruineux pour une phrase de cinquante caractères ; le nom de marque, élément flex, ne descendait pas sous son min-content et poussait la navigation hors de l'en-tête.
  Vérification après correction : aucun débordement sur 20 pages à 320, 360, 390 et 414 px, le tableau défile dans son conteneur, l'en-tête tient.

Hub de famille retravaillé : une liste de dix liens identiques ne donne au lecteur aucun critère de choix. Chaque métier devient une carte portant son besoin prioritaire, borné à deux lignes à l'affichage sans tronquer la donnée, et son type de clientèle. La phrase « d'autres métiers seront ajoutés » ne s'affiche plus que si la famille est incomplète. Les neuf autres familles sont accessibles depuis chaque hub.
Gabarit de guide aligné sur le système avant l'arrivée des contenus : sommaire construit depuis les titres réels du guide, colonne d'appui, tableaux markdown qui défilent seuls.
Garde-fous : 142 pages, 4 950 paires comparées, similarité maximale 20,7 % (seuil 50 %), check-seo 139 pages indexables, 77 tests + 6 parcours e2e verts, Lighthouse 100/100/100/100 et CLS 0 sur accueil, métier, hub et comparatif.

## Cohérence : le statut de plateforme agréée vient de la donnée, plus du texte (2026-10-06)

Défaut relevé en finalisant le transport : les correcteurs de ces lots avaient retiré l'affirmation « plateforme agréée DGFiP » des justifications d'outils, la jugeant non établie, pendant que 88 autres métiers continuaient de l'affirmer. En comptant, le constat était plus large — **les 300 justifications portaient toutes une affirmation réglementaire, en 225 formulations distinctes**, alors que cette donnée est canonique et sourcée dans `src/content/outils/*.json`. C'est une affirmation réglementaire recopiée à la main trois cents fois : elle ne pouvait que dériver.
Composant `StatutPlateforme` : le statut est rendu une fois par carte depuis la donnée, avec son lien vers le registre DGFiP et la mention explicite que la date d'immatriculation reste à relever (TODO #9). Les 305 phrases réglementaires sont retirées des justifications, qui ne gardent que leur travail propre — pourquoi cet outil pour ce métier.
Retirer une phrase laisse parfois un pronom orphelin : 48 justifications commençaient alors par « Elle convient à… », dont l'antécédent était « la plateforme » de la phrase supprimée. Elles nomment désormais l'outil, ce qui se lit mieux que le pronom d'origine ; 16 démonstratifs deviennent des possessifs, et 8 phrases qui fusionnaient statut et argument métier ont été réécrites une par une, en reprenant le périmètre réel de l'outil dans `src/content/outils`, sans rien affirmer de plus.
Contrôle après coup : 0 justification affirmant encore un statut, 0 pronom sans antécédent, 0 anomalie de forme sur 300.
Effet de bord utile : si le statut d'Indy n'est pas confirmé à la source (TODO #18), un seul champ corrige les 100 pages.
Garde-fous : 142 pages, similarité maximale 21,2 % (seuil 50 %), check-seo 139 pages indexables, 77 tests + 6 parcours e2e verts.

## Pages de confiance et page d'erreur alignées sur le système (2026-10-06)

Les pages « transparence », « à propos » et 404 portaient encore la mise en page d'avant le système : un article en pleine largeur, des titres sans repère, aucune suite proposée.
Transparence, qui porte l'engagement central du site, énonce désormais « ce que l'argent ne change pas » en trois cartes vérifiables plutôt qu'en liste de déclarations, et renvoie à la méthode, à la page À propos et à la politique de confidentialité depuis une colonne d'appui.
La page 404 était un cul-de-sac : un seul lien, vers l'accueil. Elle propose maintenant le quiz, les dix familles de métiers réellement publiées et les trois outils du site — 15 liens internes construits depuis le contenu, jamais une liste figée qui survivrait à la suppression d'une famille.
Lighthouse 100/100/100 sur les trois pages ; le score SEO de 66 sur « à propos » et 404 vient de leur `noindex`, voulu — la page À propos reste hors index tant que l'identité de l'éditeur est un placeholder (TODO #3), et une page d'erreur n'a pas à être indexée.
Contrôle de non-régression : aucun débordement horizontal sur 15 pages à 320, 360, 414 et 768 px.

## Troisième garde-fou : les liens internes (2026-10-06)

Les 15 pages de comparatif ont vécu plusieurs phases sans qu'aucun lien du site n'y mène, et rien ne l'a signalé — il a fallu un `grep` manuel pendant une revue. Un lien cassé se signalerait encore moins : rien ne contrôlait que les cibles internes existent.
`check-liens` compare chaque `href` interne du site rendu à l'ensemble des pages réellement construites et des fichiers réellement servis, en tenant compte des redirections affiliées `/go/…` servies par l'hébergeur. Résultat sur le site actuel : **4 667 liens analysés, aucune cible manquante.**
Le garde-fou a été éprouvé plutôt que supposé : un lien volontairement cassé (`/outils/quizz`) dans le build le fait échouer avec le code 1, en nommant la page d'origine. Branché dans `pnpm verify` et dans la CI, après `check:seo`.

## Phase 5 — les 10 guides piliers publiés (2026-10-06)

Les dix guides sont en ligne : 1 434 à 1 555 mots chacun (cible 1 200 à 2 000), 10 à 20 sources officielles, tous passés par une vérification adversariale puis une correction — **10 points bloquants relevés et traités avant publication**.
Défaut de ma consigne, corrigé avant import : j'avais écrit que le guide calendrier pouvait porter les dates « en toutes lettres », au sens d'explicitement. Le rédacteur l'a pris au pied de la lettre et les a épelées — « depuis le premier septembre deux mille vingt-six ». Les 19 occurrences sont revenues à la forme usuelle. Les neuf autres guides, sans cette consigne, écrivaient déjà des dates normales.
Le gabarit de guide avait été écrit sans aucun contenu pour l'éprouver : il a été testé sur une fixture temporaire avant l'import — sommaire construit depuis les vrais titres, ancre qui tombe sous l'en-tête collant, 72 caractères par ligne, et un tableau large qui défile dans son conteneur (324 px de conteneur pour 504 px de contenu) sans pousser la page. Vérifié ensuite sur les dix guides réels : **84 ancres de sommaire, aucune morte, aucun débordement, aucun tableau sans défilement.**
Les guides étaient orphelins comme l'avaient été les comparatifs : aucune page d'index, aucune entrée de menu. L'index `/guides` existe, et la navigation principale y mène — le commentaire du gabarit d'en-tête annonçait cet ajout « en Phase 5 », il est fait.
`check-seo` a rejeté ma propre description d'index à 166 caractères : le garde-fou sert aussi à son auteur.
Garde-fous : 153 pages, similarité maximale 20,8 % (seuil 50 %), check-seo 150 pages indexables, check-liens 5 345 liens sans cible manquante, 77 tests + 6 parcours e2e verts, Lighthouse 100/100/100/100 et CLS 0 sur un guide.

## Pitch partenaires en motion design (2026-10-07)

Présentation animée de 30 s pour les éditeurs et leurs programmes d'affiliation (TODO #6), publiée en page autonome sans nom de marque : https://claude.ai/artifact/3BxhNJrafSYbS74YiwHN1J (privée, à partager depuis son menu Partager). Elle est **générée depuis les données** : dates d'`echeances.json`, extraits exacts des fiches métier, comptes de métiers, d'outils, de comparatifs et de sources. Le build échoue sur un placeholder, un extrait infidèle, un nombre affiché sans origine ou une espace fautive devant une ponctuation.
Revue adversariale à trois dimensions, chaque constat contre-vérifié : 38 constats, 36 confirmés, tous traités. Les plus graves : la phrase « le partenariat ajoute un lien suivi » était fausse (il remplace un lien suivi par un lien `sponsored`, et rien d'autre ne change), et en 844×390 le jeton € sortait de son couloir pour se poser sur « Recommandation » — exactement le message que le site s'interdit.
Effet sur le site : le quiz départageait les ex æquo selon l'ordre de la liste des programmes d'affiliation visés, ce qui tranchait une recommandation sur cinq. Il départage désormais par ordre alphabétique, règle publiée sur les pages Méthode et Quiz.
Le comptage des sources a été resserré (une clé par document Légifrance ou BOFiP, quel que soit le chemin) : 367 documents .gouv.fr distincts, et non 371.
Banc Playwright : 8 tailles d'écran dont le zoom 200 % et 320 px, 2 thèmes, contrastes forcés, mouvement réduit, CDN coupé, polices bloquées, pause en pleine transition, clavier sans raccourci global — 0 anomalie.

## Correctif CSP de production (2026-10-08)

**Bug critique trouvé en préparant l'intégration motion.** `netlify.toml` imposait `script-src 'self'`. Or Astro place en ligne l'amorce des îlots (4 380 o), les directives `client:*` et les scripts de composants. En production, ces scripts étaient bloqués et **le quiz, le simulateur et le vérificateur ne s'hydrataient pas**.
**Mesure avec l'ancienne politique**, injectée dans un navigateur réel :

- accueil : 4 violations ;
- quiz : 4 violations, quiz non hydraté ;
- simulateur : 5 violations ;
- vérificateur : 4 violations ;
- page métier : 2 violations.

**Pourquoi Lighthouse ne l'a pas vu :** les mesures à 100 tournaient sur `astro preview`, qui ignore les en-têtes Netlify.
**Correctif :**

- après le build, `scripts/generate-csp.ts` calcule l'empreinte sha256 de chaque script en ligne exécutable de `dist` (sans le JSON-LD) et écrit la politique dans `dist/_headers` ;
- la CSP est retirée de `netlify.toml`, car deux politiques s'intersectent ;
- un nouveau garde, `check-csp`, tourne dans `verify` et la CI. Il échoue si un script en ligne manque à `_headers` ou si `netlify.toml` redéclare une CSP.

**Résultat avec la nouvelle politique :** 0 violation sur les 5 pages et quiz hydraté. 7 empreintes couvrent les 316 scripts en ligne des 153 pages.
**Correctif annexe :** `pageTitle` gardait un titre complet de 60 caractères, que `check-seo` rejette (borne stricte). Les deux bornes sont désormais alignées, avec un test.

## Motion design sur données réelles (2026-10-08)

**Point de départ.** Un designer a livré un lot « motion » écrit sans accès au dépôt : CSS, illustration du hero, téléscripteur, compteurs, sélecteur de métier, gabarits de hub et de fiche outil. Le rendu est repris, **appliqué aux données réelles**. Ce qui ne l'était pas a été écarté :

- une facture d'exemple à montant inventé ;
- une frise de test « en cours » sans test ;
- des points « [SOURCE À CITER] » et des listes d'outils écrites en dur ;
- une tuile de 165 plateformes, dont 16 dossiers en attente issus d'une copie tierce ;
- une mention « lien affilié » visible seulement au survol ;
- du texte blanc à 2,5:1 en sombre ;
- des boucles infinies sans pause ;
- l'opacité d'entrée sur le titre LCP.

**Règles du mouvement** (`src/styles/motion.css`) :

- l'état de base est l'état final ;
- les entrées n'existent qu'en `prefers-reduced-motion: no-preference` ;
- les boucles exigent en plus `html.anim-on`, posée avant le premier rendu par un script de tête autorisé par empreinte CSP. Sans JavaScript, rien ne boucle.

Un **bouton pause** dans l'en-tête arrête toutes les boucles (WCAG 2.2.2). Il expose `aria-pressed` et son choix est mémorisé localement, ce que mentionne la page confidentialité.

**Sur les pages :**

- **Accueil** : titre animé par translation seule, badge de la réforme dérivé d'`echeances.json`, illustration sans montant, téléscripteur des familles (liste statique par défaut, doublon `inert`). Les compteurs montrent 100 métiers, 367 documents .gouv.fr (même calcul que la présentation) et 6 logiciels.
- **Hub** : titre grammatical pour les 10 familles (« pour l’artisanat »), sélecteur à boutons radio natifs qui reprend la recommandation publiée sur la fiche du métier, outils retenus avec leur nombre de fiches (ex æquo départagés par l'ordre alphabétique), panneau vers le quiz.
- **Fiche outil** : essentiel tiré des données, frise du protocole lue dans la collection `tests` (aucune étape réalisée), 5 comparatifs.
- **Quiz** : préremplissage `?metier=` (slug inconnu ignoré), focus déplacé sur le résultat, anneau de validation.
- **Libellés** : « Test en cours » devient « Test à venir » partout. Aucun test n'a commencé, et le schéma interdit une date de test.

**Pièges trouvés et corrigés :**

- LightningCSS fusionnait `animation-timeline` dans le raccourci `animation`, une forme que Chrome rejette : la barre de lecture restait pleine.
- `.badge-ok`, hors couche, écrasait `inline-flex`.
- Le halo du hero formait un rectangle à arêtes nettes.
- Le CLS du quiz desktop valait 0,005 (corrigé par `scrollbar-gutter: stable`).
- Prettier insérait un espace après l'élision.

**Nouveau garde `check-placeholders` :** aucun marqueur de gabarit en capitales ne peut atteindre `dist`.

**Résultats :**

- 118 tests et 11 parcours e2e verts ;
- banc Playwright sans anomalie (5 tailles, 2 thèmes, pause, mouvement réduit, sans JS, contrastes forcés, axe WCAG 2.2 AA) ;
- Lighthouse 100/100/100/100 en desktop et en mobile sur 6 types de page, sous la vraie CSP avec compression.

**Revue contradictoire en 3 dimensions** (affirmations, mouvement, accessibilité ; 28 agents, chaque constat soumis à un sceptique) : 25 constats, **22 confirmés et tous corrigés**.

Le téléscripteur concentrait le pire, avec un constat bloquant en accessibilité :

- un clic en cours de boucle ne naviguait pas, car le focus au clic remettait la piste à zéro ;
- le doublon `inert` était visible mais inerte au pointeur ;
- au clavier, le lien focalisé était rogné sous le fondu (WCAG 2.4.11).

Correctif : la pause au focus pointeur, l'arrêt et le défilement jusqu'au lien au seul focus clavier, et un doublon cliquable mais hors tabulation.

Les autres corrections :

- **Hero** : `overflow-clip-margin` est ignoré par Chromium quand un seul axe est découpé, ce qui rognait anneaux de focus et ombres. La boîte de découpe est désormais élargie.
- **Compteur** : il affichait « -5 » sur une ou deux images (origine du temps).
- **Barre de lecture** : elle paraissait pleine sur une page qui ne défile pas.
- **Reflet des titres** : l'animation était infinie et non compositée ; elle est désormais bornée à 2 passages.
- **Fiche outil** :
  - marge de la frise annulée par motion.css ;
  - pastille et frise du protocole lues dans deux collections, désormais un seul prédicat, avec un test de concordance et un schéma qui exige la date d'un test mené ;
  - offre non relevée omise du tableau des tarifs.
- **Accueil** :
  - badge de la réforme non sourcé, désormais « Réception des factures électroniques obligatoire depuis le … », avec sa source impots.gouv.fr ;
  - promesse « deux questions » sans lien vers le simulateur ;
  - « passés au crible » remplacé par « comparés ».
- **Sélecteur** : un choix fait avant l'hydratation était perdu.
- **Impression** : les blocs non révélés sortaient blancs.
- **Rangs des étapes** : ils étaient masqués à VoiceOver.

**Réfutés** : 3 constats.
**Tests de non-régression ajoutés** : clic en milieu de boucle (doublon compris), focus clavier entier, choix avant hydratation. Bilan : 14 parcours e2e et 119 tests verts.

Les 40 points de facturation par famille arrivent dans une PR séparée, après leur vérification contradictoire.

## Points de facturation par famille (2026-10-08)

Les 10 hubs affichent désormais **4 points de facturation propres à leur famille**, soit 40 points (`src/data/points-familles.json`). Chaque point a suivi trois étapes :

- **rédaction** à partir des 10 fiches de la famille : il généralise ce qu'établissent au moins 2 fiches, sans extrapoler ;
- **vérification contradictoire** contre sa source officielle : l'extrait est retrouvé, recherche restreinte au domaine .gouv.fr ;
- **correction** avant publication.

Les vérificateurs ont fait corriger des affirmations trop larges. Exemples :

- la facture d'acompte limitée aux clients professionnels et personnes morales, comme le prévoit le BOFiP ;
- l'autoliquidation limitée au donneur d'ordre, jamais au client final ;
- le taux de 5,5 % des produits préparés livrés à un revendeur.

**Garde-fous** (`src/lib/points-familles.test.ts`) :

- 10 familles de 4 points ;
- au moins 2 métiers existants de la famille par point ;
- chaque source est un document .gouv.fr **déjà cité par un métier concerné** ;
- aucune année dans les textes.

Le nombre de documents .gouv.fr cités reste à 367 : aucune source nouvelle et non vérifiée n'est entrée.

**Reprise après la limite de session :** la reprise du workflow relançait aussi des corrections déjà faites, car l'ordre des appels varie avec le parallélisme et le cache ne couvre qu'un préfixe. Elle a été arrêtée, et les 2 corrections manquantes ont tourné à part, à partir des rédactions et vérifications du journal.

**Effet de bord sur les fiches métier.** Les vérificateurs ont signalé des inexactitudes à reprendre dans une passe séparée :

- maçon, couvreur, plombier, traiteur et chef à domicile généralisent la facture d'acompte aux particuliers ;
- chef à domicile prête à l'option pour les débits un report d'exigibilité ;
- carreleur, plaquiste et ferronnier citent une version antérieure du BOI-TVA-DECLA-10-10-20 ;
- fleuriste parle de « vente à distance » sans préciser « intracommunautaire ».

**Résultats :** 124 tests et 14 parcours e2e verts, banc motion sans anomalie, Lighthouse 100/100/100/100 sur deux hubs en desktop et en mobile.

## Correction des fiches métier signalées par la vérification des points (2026-10-09)

Les inexactitudes relevées en marge des 40 points ont été corrigées en deux vagues (PR #28, puis celle-ci). Chaque modification a suivi le même circuit :

- **proposition** par un agent par thème, après recontrôle de la règle sur sa source .gouv.fr, sans écrire sur disque ;
- **vérification contradictoire** par un sceptique par thème : verdict accepte, amende ou rejette, avec l'extrait officiel ;
- **application déterministe** : l'ancien texte doit correspondre exactement au contenu publié, sinon arrêt.

**Bilan :** vague 1, 79 modifications sur 24 fichiers ; vague 2, 111 modifications sur 24 fichiers, aucune rejetée.

**Corrections de fond :**

- facture d'acompte obligatoire seulement pour un client professionnel ou une personne morale (BOI-TVA-DECLA-30-20-10-10) ; exigibilité à l'encaissement réservée à qui facture la TVA ;
- autoliquidation en sous-traitance : le sous-traitant en franchise en base en est exclu et garde la mention 293 B (rescrit BOI-RES-TVA-000269), y compris dans le point bâtiment n° 3 ;
- tolérance BOI-TVA-LIQ-30-20-90-40 pour la réparation et l'entretien sous 1 000 € TTC (plombier, carreleur, plaquiste) ;
- note de prestation : mentions complètes de l'arrêté n° 83-50/A (restaurateur, fleuriste, couturière, céramiste, horloger) ;
- hub agriculture : 5,5 % pour les produits destinés à l'alimentation ou à la production agricole, 10 % pour l'ornement (le texte publié annonçait 10 % à tort) ;
- URL BOFiP passées aux versions en vigueur, numéro PGP inchangé.

**Garde-fou ajouté** (`src/lib/data.test.ts`) : aucune fiche destinée aux particuliers n'impose une facture pour tout acompte sans réserver l'obligation au professionnel, à la personne morale ou à l'assujetti.

**Documents .gouv.fr cités : 367.** Le rescrit BOI-RES-TVA-000269 est entré, et BOI-TVA-BASE-20-40 est sorti : version archivée de 2019, titre inexact, et affirmations déjà couvertes par BOI-TVA-BASE-20-20. La tuile de l'accueil et la présentation recalculent ce total.

**Laissé en l'état, à relire par un humain :**

- seuil de 25 € de la note de restaurant : l'arrêté n° 25-361 de 1967 n'a pas pu être consulté ;
- sources service-public.fr de couturière, céramiste et horloger, à confirmer par un texte Légifrance ou BOFiP ;
- agriculteur : la phrase sur la paille et les fourrages ; la réécriture annoncée de L441-11 ; la notice 3520-SD ;
- plaquiste : formulation de la franchise en faq[3] et besoins_prioritaires[2] ;
- architecte : sources[2] cite encore LIQ-30-20-90-40-20160302 ;
- chef à domicile : la mention du devis ; couvreur : le délai de L221-10 du Code de la consommation.

**Résultats :** 125 tests, 14 parcours e2e, tous les gardes de `pnpm verify` verts.

## Points laissés à relecture humaine : vague 3 (2026-10-09)

Les points listés en fin de l'entrée précédente ont été repris par le même circuit (proposition, vérification contradictoire, application déterministe) : 37 modifications sur 12 fichiers, aucune rejetée.

- **Note de restaurant** : un repas servi donne lieu à une note en fin de repas, quel que soit le montant (fiches DGCCRF « Restaurants » et « Ticket de caisse et de carte bancaire », qui traitent la restauration à part des services de 25 € et plus). Le seuil de 25 € reste celui des autres prestations de services (arrêté n° 83-50/A). Corrigé dans restaurateur, pizzeria (salle et vente à emporter distinguées), bar-brasserie, glacier, food-truck et le point restauration n° 3. Le texte de l'arrêté n° 25-361 de 1967 reste illisible depuis l'environnement : la règle repose sur les pages DGCCRF.
- **Contrat signé au domicile** : délai de sept jours avant tout paiement (code de la consommation, article L221-10) ajouté à couvreur et menuisier.
- **Plaquiste** : franchise en base exclue de l'autoliquidation dans faq[3] et besoins_prioritaires[2].
- **Architecte** : BOI-TVA-LIQ-30-20-90-40 passé à sa version en vigueur ; BOI-TVA-LIQ-30-20-90-30 ajouté pour la facture rectificative.
- **Chef à domicile** : devis et facture des services à la personne alignés sur l'arrêté du 17 mars 2015.
- **Agriculture** : la phrase sur la paille et les fourrages corrigée ; L441-11 n'est cité nulle part ; 3520-SD repris en vague 3b.
- **Service-Public** : le site a migré sur service-public.gouv.fr. Cinq pages retrouvées et vérifiées (F31808, F22387, A15073, F32973, R44572) : 31 URL migrées dans 27 fichiers, titres et mentions en texte compris. Six pages restent introuvables (F31410, F23897, F33177, F22215, F31199, F31554) : réaffectées en vague 3b.

**Documents .gouv.fr cités : 373** (+6, dont les pages Service-Public désormais en .gouv.fr).

## Back office, espaces publicitaires et newsletter (2026-10-09)

Trois briques de monétisation, conçues puis soumises à une contre-expertise en quatre angles (sécurité, conformité, intégration Netlify, produit), et enfin à une revue contradictoire du code.

**Back office `/admin`** (liens d'affiliation et annonces) :

- Les données restent des fichiers du dépôt (`src/data/affiliation.json`, `src/data/publicites.json`), validés par Zod au build, en CI et dans le formulaire.
- Une publication crée un commit unique et une pull request. « Mettre en ligne » ne s'active que si la CI du dépôt est verte sur ce commit, si la demande ne contient que des données du back office et si la branche est à jour. La publication est aussi refusée tant que `main` n'est pas protégée par un ruleset.
- **Jeton GitHub à portée fine** : il ne vit qu'en mémoire. Il est effacé en quittant la page, après 30 minutes d'inactivité ou sur un refus de GitHub. Le jeton est refusé s'il est classique, sans expiration ou valable plus de 90 jours.
- **Relais same-origin** : les appels passent par la fonction `/admin/gh/*`, limitée au dépôt. La CSP garde ainsi `connect-src 'self'`, que `check:csp` impose désormais.
- **URL saisies** : https uniquement, en ASCII visible, sans port ni fragment, et jamais vers le site lui-même. Les textes ne peuvent contenir aucun caractère invisible.
- **Images** : signature binaire contrôlée, 640 × 360 px au moins et 300 Ko au plus. Le contrôle est refait au build.
- **Redirections `/go/`** : elles sont désormais écrites dans `dist/_redirects` au postbuild, au lieu de modifier `netlify.toml`. `check:liens` vérifie que chaque lien `/go/` a sa règle.

**Espaces publicitaires** (vente directe, sans régie, sans traceur) :

- Trois emplacements, tous en fin de page : accueil, guides, pages famille. Un test interdit tout autre emplacement. Aucune annonce sur les fiches métier, qui portent « Notre recommandation ».
- Mention « Publicité » et nom de l'annonceur visibles. Raison sociale et SIREN publiés sur `/transparence`. Paramètres `utm_*` ajoutés au lien.
- Un éditeur comparé ne peut annoncer que sur l'accueil et les guides, et son annonce le signale.
- Formulations refusées dans les annonces : recommandation, classement, note, avis, agrément.
- Reconstruction nocturne à 0 h 05 (Paris), seulement les jours où la sélection d'annonces change.

**Newsletter** :

- Formulaire HTML sans JavaScript, double opt-in Brevo par une fonction Netlify.
- Liste et modèle de confirmation distincts de ceux du rappel d'échéance.
- Champ piège, contrôle d'origine, limite de 5 envois par minute et par IP.

**Pages réécrites** :

- `/transparence` déclare que les 6 logiciels ont été retenus, au lancement, parmi des éditeurs qui ont un programme d'affiliation (PLAN.md, section 5). Elle publie le tableau des relations de chaque éditeur avec le site.
- Les promesses de neutralité couvrent désormais aussi les achats d'espace.
- `/confidentialite` nomme les sous-traitants (prestataire d'emailing, Netlify), le transfert hors UE, la liste d'opposition et l'ensemble des droits.
- Nouvelle page `/publicite` : offre aux annonceurs, tarif sur devis, aucun prix inventé.

**Tant que l'éditeur n'est pas identifié** (`EDITEUR_IDENTIFIE`, mentions légales) : aucun formulaire email et aucune annonce ne sont publiés (RGPD, art. 13 ; LCEN).

**Régression évitée** : la première version faisait embarquer Zod par l'îlot du quiz, sur l'accueil et `/outils/quiz`. `check:csp` échoue désormais si une page publique charge Zod.

**Gardes ajoutées** :

- `check-seo` : cohérence entre le sitemap et le noindex. Elle a révélé que `/a-propos`, en noindex, figurait au sitemap.
- JSON-LD échappé (`jsonLdSur`), et `set:html` limité aux contenus maîtrisés.
- CI en `permissions: contents: read`.

**Actions humaines** : `TODO.md`, points 19 à 27. Parmi eux : ruleset de `main`, jeton, variables Netlify limitées à la Production, Brevo sans suivi des ouvertures, build hook avec alerte d'échec, conditions de vente, questions juridiques avant la première vente.
