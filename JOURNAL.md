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
