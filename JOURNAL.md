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
