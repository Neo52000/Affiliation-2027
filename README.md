# Affiliation 2027 — Facturation électronique par métier

Site statique français qui aide TPE, artisans, professions libérales et
micro-entrepreneurs à choisir leur logiciel de facturation électronique et leur
compte pro, métier par métier. Monétisation par liens d'affiliation et espaces
publicitaires vendus en direct, signalés un par un et sans influence sur les
classements ; newsletter en double opt-in.

**Positionnement (non négociable)** : angle par métier, classement indépendant
des commissions (méthode publique `/methode`), tests réels documentés
(`statut: a_tester` tant qu'un humain n'a pas testé), données datées et sourcées.

## Stack

Astro (statique, TypeScript strictest) · Tailwind CSS 4 · îlots Preact
uniquement sur les 3 outils interactifs · Content Collections + Zod ·
Netlify (fonctions : inscriptions email, reconstruction quotidienne) · Vitest + Playwright.
Back office `/admin` : îlot Preact qui édite les données via l'API GitHub
(pull request vérifiée par la CI, puis mise en ligne).

## Démarrer

```bash
pnpm install
pnpm dev          # développement
pnpm verify       # types + lint + tests + build + similarité + SEO
PW_CHROMIUM=/chemin/vers/chromium pnpm test:e2e   # parcours Playwright
```

## Architecture

```
src/content/
  metiers/   # 1 JSON par métier (schéma Zod : spécificités, exemple de facture, FAQ…)
  outils/    # 1 JSON par logiciel (statut PA sourcé, plans datés, notes null si a_tester)
  tests/     # fiches de test réel — remplies par un humain, jamais générées
src/data/
  echeances.json            # calendrier de la réforme, source unique des dates
  plateformes-agreees.json  # registre DGFiP (165 PA), provenance affichée
  affiliation.json          # liens affiliés par outil (édités dans /admin)
  publicites.json           # campagnes publicitaires (éditées dans /admin)
  mentions-factures.json    # mentions obligatoires sourcées (vérificateur)
  hubs.json                 # introductions des hubs famille
scripts/
  check-similarity.ts   # anti-duplication (Jaccard > 0,5 = build FAIL)
  check-seo.ts          # titles/descriptions uniques et bornés
  check-links.ts        # routine mensuelle : URL sources et affiliées
  generate-redirects.ts # dist/_redirects : règles /go/ des liens actifs (postbuild)
  generate-csp.ts       # dist/_headers : CSP par empreintes (postbuild)
  import-metiers.ts     # import des contenus vérifiés du pipeline de rédaction
```

## Règles absolues

1. Aucune donnée inventée (prix, notes, tests, avis, dates) : introuvable = `null` + `TODO.md`.
2. La commission n'influence ni l'ordre ni la note (elle n'est une entrée nulle part).
3. Tout lien affilié est signalé ; `/go/*` exclu de robots.txt. Toute annonce porte
   « Publicité » et le nom de l'annonceur, hors classements, comparatifs et outils.
4. Aucune date réglementaire hors `echeances.json`, chacune sourcée .gouv.fr.
5. Le build échoue si : similarité > 0,5, title/description dupliqué, test rouge.
6. Aucun cookie soumis à consentement, aucun script tiers ; secrets en variables
   d'environnement seulement.

## Opérations

- `PLAN.md` : plan validé (arborescence, 100 métiers, risques).
- `JOURNAL.md` : compte rendu par phase, décisions hors spécification.
- `TODO.md` : actions humaines (variables de lancement, données à re-vérifier).
- `MAINTENANCE.md` : routine mensuelle (prix, liste PA, calendrier, +10 métiers, liens).

Variables de lancement non renseignées (`TODO_NOM_SITE`, domaine, éditeur légal,
liens affiliés, outil email) : voir `TODO.md` — point d'entrée unique
`src/config.ts` + `astro.config.mjs` (site).
