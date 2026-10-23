/**
 * Envoi des événements de mesure (src/lib/mesure.ts) depuis le navigateur :
 * sendBeacon, sans cookie ni identifiant, et silencieux en cas d'échec.
 * Aucun envoi sans sendBeacon (navigateur ancien) : la page n'en dépend pas.
 */
export interface EvenementClient {
  type: 'quiz_termine' | 'clic_editeur';
  outil: string;
  emplacement: string;
}

export function envoyerMesure(e: EvenementClient): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/mesure', JSON.stringify(e));
    }
  } catch {
    // La mesure ne doit jamais gêner la navigation.
  }
}

/** Clic sur un bouton éditeur (`data-outil` + `data-emplacement`), où qu'il soit dans la page. */
export function suivreClics(racine: Document = document): void {
  racine.addEventListener('click', (ev) => {
    const cible = ev.target instanceof Element ? ev.target.closest('a[data-outil]') : null;
    if (!(cible instanceof HTMLAnchorElement)) return;
    const { outil, emplacement } = cible.dataset;
    if (outil && emplacement) envoyerMesure({ type: 'clic_editeur', outil, emplacement });
  });
}

export interface TotalMesure {
  jour: string;
  type: EvenementClient['type'];
  outil: string;
  emplacement: string;
  n: number;
}

/** Entonnoir par logiciel sur la fenêtre lue : quiz terminés (logiciel retenu) et clics éditeur. */
export function syntheseParOutil(
  totaux: readonly TotalMesure[],
): { outil: string; quiz: number; clics: number }[] {
  const lignes = new Map<string, { outil: string; quiz: number; clics: number }>();
  for (const t of totaux) {
    if (t.outil === 'aucun') continue;
    const l = lignes.get(t.outil) ?? { outil: t.outil, quiz: 0, clics: 0 };
    if (t.type === 'quiz_termine') l.quiz += t.n;
    else l.clics += t.n;
    lignes.set(t.outil, l);
  }
  return [...lignes.values()].sort((a, b) => b.clics - a.clics || a.outil.localeCompare(b.outil));
}
