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
