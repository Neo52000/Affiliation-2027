/**
 * Moteur de la présentation partenaires : une timeline GSAP maîtresse de 30 s.
 * Transpilé et inséré dans la page par scripts/build-presentation.ts.
 *
 * Déterminisme (la page doit pouvoir être figée à n'importe quel instant) :
 * - uniquement des tweens de propriétés, aucun tl.call(), aucun repeat infini,
 *   aucun hasard ;
 * - toute l'interface autour de la scène dérive d'un seul syncUI(), appelé à
 *   chaque image et après chaque saut.
 * Mode statique (mouvement réduit, ou GSAP non chargé) : une scène à la fois,
 * sans aucun déplacement.
 */
(() => {
  type Gsap = typeof import('gsap').gsap;
  type Timeline = ReturnType<Gsap['timeline']>;

  interface Scene {
    id: string;
    debut: number;
    /** Instant où tout le contenu de la scène est en place (tests, navigation à l'arrêt) */
    tenue: number;
    fin: number;
  }

  /** Découpage de la timeline, en secondes. La durée totale est fixée à 30,0 s. */
  const SCENES: readonly Scene[] = [
    { id: 'scene-echeance', debut: 0, tenue: 3.8, fin: 4.5 },
    { id: 'scene-metiers', debut: 4.5, tenue: 7.2, fin: 12 },
    { id: 'scene-registre', debut: 12, tenue: 15.6, fin: 18.5 },
    { id: 'scene-independance', debut: 18.5, tenue: 23.2, fin: 25 },
    { id: 'scene-proposition', debut: 25, tenue: 28.5, fin: 30 },
  ];
  const DUREE = 30;
  /** Rythme de la lecture en mode statique : une scène toutes les 6 s, sans mouvement */
  const PAS_STATIQUE_MS = 6000;

  // Courbes du design system, exprimées dans les courbes natives de GSAP :
  const SORTIE = 'expo.out'; // easing-out    cubic-bezier(0.16, 1, 0.3, 1)
  const RESSORT = 'back.out(1.7)'; // easing-spring cubic-bezier(0.34, 1.56, 0.64, 1)
  const BASCULE = 'power2.inOut'; // easing-in-out cubic-bezier(0.65, 0, 0.35, 1)

  const racine = document.getElementById('pitch');
  const boutonLecture = document.getElementById('bouton-lecture');
  if (!racine || !(boutonLecture instanceof HTMLButtonElement)) return;

  const scenesEl = SCENES.map((s) => document.getElementById(s.id));
  if (scenesEl.some((el) => el === null)) return;
  const scenes = scenesEl as HTMLElement[];
  const segments = Array.from(racine.querySelectorAll<HTMLButtonElement>('.segment'));
  const remplissages = segments.map((s) => s.querySelector<HTMLElement>('.segment-remplissage'));
  const libelleLecture = boutonLecture.querySelector('.bouton-libelle');
  const iconeLecture = boutonLecture.querySelector<SVGElement>('.icone-lecture');
  const iconePause = boutonLecture.querySelector<SVGElement>('.icone-pause');
  const annonce = document.getElementById('annonce');
  const zoneScenes = racine.querySelector('.scenes');

  const g = (window as Window & { gsap?: Gsap }).gsap;
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode: 'mouvement' | 'statique' = g && !mouvementReduit ? 'mouvement' : 'statique';
  racine.dataset['mode'] = mode;

  const libelleScene = (i: number): string =>
    segments[i]?.querySelector('.segment-libelle')?.textContent?.trim() ?? `Scène ${i + 1}`;

  const annoncer = (i: number): void => {
    if (annonce) annonce.textContent = `Scène ${i + 1} sur ${SCENES.length} : ${libelleScene(i)}`;
  };

  let etatBouton = '';
  const afficherBouton = (etat: 'Lecture' | 'Pause' | 'Rejouer'): void => {
    if (etat === etatBouton) return;
    etatBouton = etat;
    if (libelleLecture) libelleLecture.textContent = etat;
    if (iconeLecture) iconeLecture.toggleAttribute('hidden', etat === 'Pause');
    if (iconePause) iconePause.toggleAttribute('hidden', etat !== 'Pause');
  };

  let indexAffiche = -1;
  const marquerScene = (i: number): void => {
    if (i === indexAffiche) return;
    indexAffiche = i;
    segments.forEach((seg, k) => {
      if (k === i) seg.setAttribute('aria-current', 'step');
      else seg.removeAttribute('aria-current');
    });
    // Les scènes empilées hors champ sortent de l'arbre d'accessibilité et du focus.
    scenes.forEach((el, k) => {
      el.inert = k !== i;
    });
  };

  /** Index de la scène qui contient l'instant t. */
  const sceneA = (t: number): number => {
    let i = 0;
    SCENES.forEach((s, k) => {
      if (t >= s.debut) i = k;
    });
    return i;
  };

  // -------------------------------------------------------------------------
  // Mode statique
  // -------------------------------------------------------------------------
  if (mode === 'statique' || !g) {
    let courante = 0;
    let minuterie: number | null = null;

    const montrer = (i: number): void => {
      courante = Math.max(0, Math.min(SCENES.length - 1, i));
      scenes.forEach((el, k) => {
        el.hidden = k !== courante;
      });
      remplissages.forEach((r, k) => {
        if (r) r.style.transform = `scaleX(${k <= courante ? 1 : 0})`;
      });
      marquerScene(courante);
    };

    const arreter = (): void => {
      if (minuterie !== null) window.clearInterval(minuterie);
      minuterie = null;
      afficherBouton(courante === SCENES.length - 1 ? 'Rejouer' : 'Lecture');
    };

    const lire = (): void => {
      if (courante === SCENES.length - 1) montrer(0);
      afficherBouton('Pause');
      minuterie = window.setInterval(() => {
        montrer(courante + 1);
        if (courante === SCENES.length - 1) arreter();
      }, PAS_STATIQUE_MS);
    };

    const aller = (i: number): void => {
      arreter();
      montrer(i);
      afficherBouton(courante === SCENES.length - 1 ? 'Rejouer' : 'Lecture');
      annoncer(courante);
    };

    boutonLecture.addEventListener('click', () => (minuterie === null ? lire() : arreter()));
    segments.forEach((seg, k) => seg.addEventListener('click', () => aller(k)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') aller(courante + 1);
      else if (e.key === 'ArrowLeft') aller(courante - 1);
      else if (e.key === 'Home') aller(0);
      else if (e.key === 'End') aller(SCENES.length - 1);
    });

    montrer(0);
    afficherBouton('Lecture');
    (window as Window & { pitch?: unknown }).pitch = {
      mode,
      duree: DUREE,
      scenes: SCENES,
      allerA: (t: number) => aller(sceneA(t)),
    };
    return;
  }

  // -------------------------------------------------------------------------
  // Mode mouvement
  // -------------------------------------------------------------------------
  const q = <T extends Element = HTMLElement>(sel: string, dans: Element): T[] =>
    Array.from(dans.querySelectorAll<T>(sel));
  const [s1, s2, s3, s4, s5] = scenes as [
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement,
  ];

  scenes.forEach((el) => {
    el.hidden = false;
  });
  g.set(scenes.slice(1), { autoAlpha: 0 });

  const tl: Timeline = g.timeline({ paused: true, defaults: { ease: SORTIE, duration: 0.7 } });

  const entrer = (el: HTMLElement, t: number): void => {
    tl.set(el, { autoAlpha: 1 }, t);
  };
  const sortir = (el: HTMLElement, t: number): void => {
    tl.to(el, { autoAlpha: 0, y: -12, duration: 0.4, ease: 'power2.in' }, t - 0.4);
  };
  const monter = (cibles: Element | Element[], t: number, distance = 28, decalage = 0): void => {
    tl.from(cibles, { y: distance, autoAlpha: 0, stagger: decalage }, t);
  };

  // Scène 1 — l'échéance. Le titre et la frise sont lisibles dès t = 0 (image
  // d'aperçu) : seul le trajet du point et la pulsation de l'échéance bougent.
  const frise = s1.querySelector('.frise');
  const anneauEcheance = s1.querySelector('.anneau');
  if (frise) tl.fromTo(frise, { '--p': 0 }, { '--p': 1, duration: 2, ease: BASCULE }, 0.4);
  if (anneauEcheance) {
    tl.fromTo(
      anneauEcheance,
      { scale: 0.6, autoAlpha: 1 },
      { scale: 1.9, autoAlpha: 0, duration: 0.6, ease: 'power1.out', repeat: 1 },
      2.4,
    );
  }
  sortir(s1, SCENES[0]?.fin ?? 4.5);

  // Scène 2 — trois métiers, trois besoins.
  entrer(s2, 4.5);
  monter(q('.surtitre, .titre-scene', s2), 4.5, 28, 0.08);
  monter(q('.carte', s2), 4.8, 36, 0.16);
  tl.from(
    q('.pastille', s2),
    { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: RESSORT, stagger: 0.08 },
    5.6,
  );
  tl.from(q('.legende', s2), { autoAlpha: 0, duration: 0.5 }, 5.9);
  sortir(s2, 12);

  // Scène 3 — le registre se remplit, le compteur suit les points.
  const points = q('.point', s3);
  const compteur = s3.querySelector<HTMLElement>('.compteur-valeur');
  const total = Number(compteur?.textContent ?? '0');
  entrer(s3, 12);
  monter(q('.surtitre, .titre-scene', s3), 12, 28, 0.08);
  tl.from(q('.rang .picto', s3), { autoAlpha: 0, duration: 0.5, stagger: 0.04 }, 12.35);
  tl.fromTo(
    points,
    { scale: 0, autoAlpha: 0 },
    {
      scale: 1,
      autoAlpha: 1,
      duration: 0.35,
      ease: RESSORT,
      stagger: { grid: 'auto', from: 'center', amount: 1.5 },
    },
    12.35,
  );
  if (compteur) {
    // Le compteur apparaît avec la grille : jamais un « 0 » seul avant le titre.
    tl.from(compteur, { autoAlpha: 0, duration: 0.3 }, 12.35);
    tl.fromTo(
      compteur,
      { innerText: 0 },
      { innerText: total, snap: { innerText: 1 }, duration: 1.85, ease: 'none' },
      12.35,
    );
  }
  monter(q('.compteur-libelle', s3), 12.6, 16);
  monter(q('.tuile', s3), 14.3, 24, 0.15);
  sortir(s3, 18.5);

  // Scène 4 — deux entrées alimentent le classement ; la commission suit son
  // propre couloir jusqu'au financement du site. Le classement ne bouge plus.
  const fleche = s4.querySelector('.fleche');
  const couloir = s4.querySelector('.couloir');
  const jeton = s4.querySelector('.jeton-disque');
  const anneauFinancement = s4.querySelector('.anneau');
  entrer(s4, 18.5);
  monter(q('.surtitre, .titre-scene', s4), 18.5, 28, 0.08);
  monter(q('.entree', s4), 18.9, 16, 0.12);
  if (fleche) tl.fromTo(fleche, { '--p': 0 }, { '--p': 1, duration: 0.6, ease: BASCULE }, 19.3);
  monter(q('.classement li', s4), 19.7, 16, 0.12);
  if (couloir) tl.from(couloir, { autoAlpha: 0, duration: 0.5 }, 20.3);
  if (jeton) {
    tl.from(jeton, { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: RESSORT }, 20.5);
  }
  if (couloir) tl.fromTo(couloir, { '--q': 0 }, { '--q': 1, duration: 1.4, ease: BASCULE }, 20.9);
  if (anneauFinancement) {
    tl.fromTo(
      anneauFinancement,
      { scale: 0.6, autoAlpha: 1 },
      { scale: 1.8, autoAlpha: 0, duration: 0.6, ease: 'power1.out' },
      22.3,
    );
  }
  monter(q('.chapo', s4), 21.2, 16);
  tl.from(q('.legende', s4), { autoAlpha: 0, duration: 0.5 }, 21.7);
  sortir(s4, 25);

  // Scène 5 — la proposition. Tenue jusqu'à la fin.
  entrer(s5, 25);
  monter(q('.surtitre, .titre-scene', s5), 25, 32, 0.08);
  monter(q('.chapo', s5), 25.6, 18);
  monter(q('.logiciels-libelle, .logiciel', s5), 26.1, 12, 0.07);
  tl.from(q('.btn-cta', s5), { scale: 0.85, autoAlpha: 0, duration: 0.6, ease: RESSORT }, 26.8);
  tl.from(q('.contact', s5), { autoAlpha: 0, duration: 0.5 }, 27.2);

  // Durée totale fixée : la dernière image tenue dure jusqu'à 30,0 s.
  tl.set({}, {}, DUREE);

  // -------------------------------------------------------------------------
  // Interface
  // -------------------------------------------------------------------------
  const syncUI = (): void => {
    const t = tl.time();
    const i = sceneA(t);
    SCENES.forEach((s, k) => {
      const local = Math.max(0, Math.min(1, (t - s.debut) / (s.fin - s.debut)));
      const r = remplissages[k];
      if (r) r.style.transform = `scaleX(${local})`;
    });
    marquerScene(i);
    afficherBouton(tl.paused() ? (t >= DUREE ? 'Rejouer' : 'Lecture') : 'Pause');
  };

  const allerScene = (i: number, manuel: boolean): void => {
    const k = Math.max(0, Math.min(SCENES.length - 1, i));
    const s = SCENES[k];
    if (!s) return;
    if (tl.paused()) tl.pause(s.tenue);
    else tl.play(s.debut);
    syncUI();
    if (manuel) annoncer(k);
  };

  boutonLecture.addEventListener('click', () => {
    if (!tl.paused()) tl.pause();
    else if (tl.time() >= DUREE) tl.restart();
    else tl.play();
    syncUI();
  });
  segments.forEach((seg, k) => seg.addEventListener('click', () => allerScene(k, true)));

  document.addEventListener('keydown', (e) => {
    const cible = e.target;
    const surControle =
      cible instanceof HTMLButtonElement ||
      cible instanceof HTMLAnchorElement ||
      cible instanceof HTMLInputElement;
    const i = sceneA(tl.time());
    if (e.key === 'ArrowRight') allerScene(i + 1, true);
    else if (e.key === 'ArrowLeft') allerScene(i - 1, true);
    else if (e.key === 'Home') allerScene(0, true);
    else if (e.key === 'End') allerScene(SCENES.length - 1, true);
    else if ((e.key === ' ' || e.key === 'k') && !surControle) {
      e.preventDefault();
      boutonLecture.click();
    }
  });

  // Le focus qui entre dans une scène suspend la lecture (motif carrousel WAI-ARIA).
  zoneScenes?.addEventListener('focusin', () => {
    if (!tl.paused()) {
      tl.pause();
      syncUI();
    }
  });

  g.ticker.add(syncUI);
  syncUI();

  (window as Window & { pitch?: unknown }).pitch = {
    mode,
    duree: tl.duration(),
    scenes: SCENES,
    allerA: (t: number) => {
      tl.pause(t);
      syncUI();
    },
  };

  // Lecture automatique dès les polices prêtes (1,5 s au plus) : sans elles, les
  // titres se recomposeraient en cours d'animation.
  const delai = new Promise<void>((ok) => window.setTimeout(ok, 1500));
  void Promise.race([document.fonts.ready.then(() => undefined), delai]).then(() => {
    if (tl.time() === 0 && tl.paused()) {
      tl.play(0);
      syncUI();
    }
  });
})();
