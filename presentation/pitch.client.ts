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
 * dans l'état final de son animation, sans aucun déplacement.
 */
(() => {
  type Gsap = typeof import('gsap').gsap;
  type Timeline = ReturnType<Gsap['timeline']>;

  interface Scene {
    id: string;
    debut: number;
    /** Instant où tout le contenu de la scène est en place (pause, tests) */
    tenue: number;
    fin: number;
  }

  // L'hôte fournit <html> sans langue : le titre de la page doit être lu en français.
  if (!document.documentElement.lang) document.documentElement.lang = 'fr';

  /** Découpage de la timeline, en secondes. La durée totale est fixée à 30,0 s. */
  const SCENES: readonly Scene[] = [
    { id: 'scene-echeance', debut: 0, tenue: 3.8, fin: 6 },
    { id: 'scene-metiers', debut: 6, tenue: 8.2, fin: 12 },
    { id: 'scene-registre', debut: 12, tenue: 15.6, fin: 18 },
    { id: 'scene-independance', debut: 18, tenue: 22.7, fin: 24.5 },
    { id: 'scene-proposition', debut: 24.5, tenue: 27, fin: 30 },
  ];
  const DUREE = 30;
  /** Fondu enchaîné : la scène suivante commence à entrer avant la fin de la sortie */
  const AVANCE = 0.15;
  const SORTIE_DUREE = 0.35;
  /** Rythme de la lecture en mode statique : une scène toutes les 6 s, sans mouvement */
  const PAS_STATIQUE_MS = 6000;

  // Courbes du design system, exprimées dans les courbes natives de GSAP :
  const SORTIE = 'expo.out'; // easing-out    cubic-bezier(0.16, 1, 0.3, 1)
  const RESSORT = 'back.out(1.7)'; // easing-spring cubic-bezier(0.34, 1.56, 0.64, 1)
  const BASCULE = 'power2.inOut'; // easing-in-out cubic-bezier(0.65, 0, 0.35, 1)

  const racine = document.getElementById('pitch');
  const boutonLecture = document.getElementById('bouton-lecture');
  const commandes = racine?.querySelector<HTMLElement>('.commandes');
  if (!racine || !commandes || !(boutonLecture instanceof HTMLButtonElement)) return;

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

  const borner = (i: number): number => Math.max(0, Math.min(SCENES.length - 1, i));

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
    // Le focus ne doit jamais rester dans une scène qui sort du champ : il passe
    // sur le segment de la scène affichée.
    const actif = document.activeElement;
    if (actif && scenes.some((el, k) => k !== i && el.contains(actif))) {
      segments[i]?.focus({ preventScroll: true });
    }
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

  /**
   * Navigation clavier limitée à la barre de lecture (motif d'onglets) : aucune
   * touche n'est captée ailleurs dans la page, aucun raccourci à une lettre.
   */
  const brancherClavier = (courante: () => number, aller: (i: number) => void): void => {
    commandes.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const i = courante();
      const cible =
        e.key === 'ArrowRight'
          ? i + 1
          : e.key === 'ArrowLeft'
            ? i - 1
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? SCENES.length - 1
                : null;
      if (cible === null) return;
      e.preventDefault();
      const k = borner(cible);
      aller(k);
      segments[k]?.focus();
    });
  };

  // -------------------------------------------------------------------------
  // Mode statique
  // -------------------------------------------------------------------------
  if (mode === 'statique' || !g) {
    let courante = 0;
    let minuterie: number | null = null;

    const montrer = (i: number): void => {
      courante = borner(i);
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
    brancherClavier(() => courante, aller);

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
  const debut = (i: number): number => SCENES[i]?.debut ?? 0;
  const fin = (i: number): number => SCENES[i]?.fin ?? DUREE;

  scenes.forEach((el) => {
    el.hidden = false;
  });
  g.set(scenes.slice(1), { autoAlpha: 0 });
  g.set(q('.anneau', racine), { autoAlpha: 0 });

  const tl: Timeline = g.timeline({ paused: true, defaults: { ease: SORTIE, duration: 0.7 } });

  /** La scène devient visible un peu avant son début : fondu enchaîné, jamais d'image vide. */
  const entrer = (el: HTMLElement, i: number): number => {
    const t = debut(i) - AVANCE;
    tl.set(el, { autoAlpha: 1 }, t);
    return t;
  };
  const sortir = (el: HTMLElement, i: number): void => {
    tl.to(
      el,
      { autoAlpha: 0, y: -12, duration: SORTIE_DUREE, ease: BASCULE },
      fin(i) - SORTIE_DUREE,
    );
  };
  const monter = (cibles: Element | Element[], t: number, distance = 28, decalage = 0): void => {
    tl.from(cibles, { y: distance, autoAlpha: 0, stagger: decalage }, t);
  };
  /** Pulsation finie d'un anneau : visible seulement pendant sa propre animation. */
  const pulser = (anneau: Element | null, t: number, repetitions = 0): void => {
    if (!anneau) return;
    tl.set(anneau, { autoAlpha: 1, scale: 0.6 }, t);
    tl.to(
      anneau,
      { scale: 1.9, autoAlpha: 0, duration: 0.6, ease: SORTIE, repeat: repetitions },
      t,
    );
  };

  // Scène 1 — l'échéance. Le titre et la frise sont lisibles dès t = 0 (image
  // d'aperçu) : seuls le trajet du point et la pulsation de l'échéance bougent.
  const frise = s1.querySelector('.frise');
  if (frise) tl.fromTo(frise, { '--p': 0 }, { '--p': 1, duration: 2, ease: BASCULE }, 0.4);
  pulser(s1.querySelector('.anneau'), 2.4, 1);
  sortir(s1, 0);

  // Scène 2 — trois métiers, trois besoins.
  const t2 = entrer(s2, 1);
  monter(q('.surtitre, .titre-scene', s2), t2, 28, 0.08);
  monter(q('.carte', s2), t2 + 0.3, 36, 0.16);
  tl.from(
    q('.pastille', s2),
    { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: RESSORT, stagger: 0.08 },
    t2 + 1.1,
  );
  tl.from(q('.legende', s2), { autoAlpha: 0, duration: 0.5 }, t2 + 1.45);
  sortir(s2, 1);

  // Scène 3 — le registre. Les trois métiers de la scène 2 s'allument d'abord,
  // puis le registre se remplit rang par rang, une famille par ligne ; le
  // compteur avance d'une unité par point affiché.
  const t3 = entrer(s3, 2);
  monter(q('.surtitre, .titre-scene', s3), t3, 28, 0.08);
  const exemples = q('.point-exemple', s3);
  const autres = q('.point', s3).filter((p) => !p.classList.contains('point-exemple'));
  const compteur = s3.querySelector<HTMLElement>('.compteur-valeur');
  const total = Number(compteur?.textContent ?? '0');
  const tExemples = t3 + 0.35;
  const tRegistre = tExemples + 0.45;
  const remplissage = 1.5;
  const pas = autres.length > 0 ? remplissage / autres.length : 0;
  tl.fromTo(
    exemples,
    { scale: 0, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.45, ease: RESSORT, stagger: 0.1 },
    tExemples,
  );
  tl.fromTo(
    autres,
    { scale: 0.4, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.25, ease: SORTIE, stagger: { each: pas } },
    tRegistre,
  );
  // Chaque picto de famille s'allume quand son rang commence à se remplir.
  q('.rang', s3).forEach((rang) => {
    const premier = autres.findIndex((p) => rang.contains(p));
    const picto = rang.querySelector('.picto');
    if (picto && premier >= 0) {
      tl.from(picto, { autoAlpha: 0, duration: 0.3 }, tRegistre + premier * pas);
    }
  });
  if (compteur) {
    tl.from(compteur, { autoAlpha: 0, duration: 0.3 }, tExemples);
    tl.fromTo(
      compteur,
      { innerText: 0 },
      { innerText: exemples.length, snap: { innerText: 1 }, duration: 0.3, ease: 'none' },
      tExemples,
    );
    tl.fromTo(
      compteur,
      { innerText: exemples.length },
      {
        innerText: total,
        snap: { innerText: 1 },
        duration: remplissage,
        ease: 'none',
        immediateRender: false,
      },
      tRegistre,
    );
  }
  monter(q('.compteur-libelle', s3), tExemples, 16);
  monter(q('.tuile', s3), tRegistre + remplissage + 0.1, 24, 0.15);
  sortir(s3, 2);

  // Scène 4 — deux entrées alimentent le classement ; la commission suit son
  // propre couloir jusqu'au financement du site. Le classement ne bouge plus.
  const t4 = entrer(s4, 3);
  const fleche = s4.querySelector('.fleche');
  const couloir = s4.querySelector('.couloir');
  const jeton = s4.querySelector('.jeton-disque');
  monter(q('.surtitre, .titre-scene', s4), t4, 28, 0.08);
  monter(q('.entree', s4), t4 + 0.45, 16, 0.12);
  if (fleche) {
    tl.fromTo(fleche, { '--p': 0 }, { '--p': 1, duration: 0.6, ease: BASCULE }, t4 + 0.85);
  }
  monter(q('.classement li', s4), t4 + 1.25, 16, 0.12);
  if (couloir) tl.from(couloir, { autoAlpha: 0, duration: 0.4 }, t4 + 1.75);
  if (jeton) {
    tl.from(jeton, { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: RESSORT }, t4 + 1.95);
  }
  if (couloir) {
    tl.fromTo(couloir, { '--q': 0 }, { '--q': 1, duration: 1.4, ease: BASCULE }, t4 + 2.35);
  }
  pulser(s4.querySelector('.financement .anneau'), t4 + 3.75);
  tl.from(q('.legende', s4), { autoAlpha: 0, duration: 0.5 }, t4 + 4.15);
  sortir(s4, 3);

  // Scène 5 — la proposition. Les noms arrivent ensemble : aucun ordre suggéré.
  const t5 = entrer(s5, 4);
  monter(q('.surtitre, .titre-scene', s5), t5, 32, 0.08);
  monter(q('.chapo', s5), t5 + 0.6, 18);
  monter(q('.bloc-logiciels', s5), t5 + 1.05, 12);
  tl.from(
    q('.btn-cta', s5),
    { scale: 0.85, autoAlpha: 0, duration: 0.6, ease: RESSORT },
    t5 + 1.55,
  );
  const contact = q('.contact', s5);
  if (contact.length) tl.from(contact, { autoAlpha: 0, duration: 0.5 }, t5 + 1.95);

  // Durée totale fixée : la dernière image tenue dure jusqu'à 30,0 s.
  tl.set({}, {}, DUREE);

  // -------------------------------------------------------------------------
  // Interface
  // -------------------------------------------------------------------------
  const syncUI = (): void => {
    const t = tl.time();
    SCENES.forEach((s, k) => {
      const local = Math.max(0, Math.min(1, (t - s.debut) / (s.fin - s.debut)));
      const r = remplissages[k];
      if (r) r.style.transform = `scaleX(${local})`;
    });
    marquerScene(sceneA(t));
    afficherBouton(tl.paused() ? (t >= DUREE ? 'Rejouer' : 'Lecture') : 'Pause');
  };

  /**
   * Instant où se figer : jamais au milieu d'une entrée ou d'une sortie (texte
   * fantôme illisible), mais sur l'image tenue de la scène en cours.
   */
  const instantLisible = (t: number): number => {
    const i = sceneA(t);
    const s = SCENES[i];
    if (!s) return t;
    const derniere = i === SCENES.length - 1;
    if (t < s.tenue || (!derniere && t > s.fin - SORTIE_DUREE - AVANCE)) return s.tenue;
    return t;
  };

  const suspendre = (): void => {
    tl.pause(instantLisible(tl.time()));
    syncUI();
  };

  const allerScene = (i: number, manuel: boolean): void => {
    const k = borner(i);
    const s = SCENES[k];
    if (!s) return;
    if (tl.paused()) tl.pause(s.tenue);
    else tl.play(s.debut);
    syncUI();
    if (manuel) annoncer(k);
  };

  boutonLecture.addEventListener('click', () => {
    if (!tl.paused()) suspendre();
    else if (tl.time() >= DUREE) {
      tl.restart();
      syncUI();
    } else {
      tl.play();
      syncUI();
    }
  });
  segments.forEach((seg, k) => seg.addEventListener('click', () => allerScene(k, true)));
  brancherClavier(
    () => sceneA(tl.time()),
    (k) => allerScene(k, true),
  );

  // Le focus qui entre dans une scène suspend la lecture (motif carrousel WAI-ARIA).
  zoneScenes?.addEventListener('focusin', () => {
    if (!tl.paused()) suspendre();
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
