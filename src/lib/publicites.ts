/**
 * Espaces publicitaires vendus en direct (aucune régie, aucun script, aucun
 * traceur). Une campagne s'affiche au build si elle est active et si la date du
 * jour (Europe/Paris) tombe entre son début et sa fin ; une reconstruction
 * quotidienne (netlify/functions/reconstruction-quotidienne.mts) fait entrer
 * et sortir les campagnes à la bonne date.
 */

/** Champs utiles à la sélection ; le schéma complet est dans schemas.ts. */
export interface CampagneSelection {
  id: string;
  emplacement: string;
  familles: readonly string[];
  debut: string;
  fin: string;
  active: boolean;
}

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export function jourParis(instant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Une campagne sans famille cible vise toutes les familles. */
function viseFamille(c: CampagneSelection, famille: string | undefined): boolean {
  if (c.familles.length === 0) return true;
  return famille !== undefined && c.familles.includes(famille);
}

/**
 * Campagne à afficher sur un emplacement, ou null. Au plus une : le schéma
 * refuse deux campagnes actives qui se chevauchent sur le même emplacement.
 */
export function campagneActive<C extends CampagneSelection>(
  campagnes: readonly C[],
  emplacement: string,
  jour: string,
  famille?: string,
): C | null {
  const candidates = campagnes
    .filter(
      (c) =>
        c.active &&
        c.emplacement === emplacement &&
        c.debut <= jour &&
        jour <= c.fin &&
        viseFamille(c, famille),
    )
    .sort((a, b) => a.debut.localeCompare(b.debut) || a.id.localeCompare(b.id));
  return candidates[0] ?? null;
}

function familleCommune(a: CampagneSelection, b: CampagneSelection): boolean {
  if (a.familles.length === 0 || b.familles.length === 0) return true;
  return a.familles.some((f) => b.familles.includes(f));
}

/** Paires de campagnes actives qui se disputeraient un même emplacement le même jour. */
export function chevauchements<C extends CampagneSelection>(campagnes: readonly C[]): [C, C][] {
  const actives = campagnes.filter((c) => c.active);
  const paires: [C, C][] = [];
  for (let i = 0; i < actives.length; i++) {
    for (let j = i + 1; j < actives.length; j++) {
      const a = actives[i]!;
      const b = actives[j]!;
      if (
        a.emplacement === b.emplacement &&
        a.debut <= b.fin &&
        b.debut <= a.fin &&
        familleCommune(a, b)
      ) {
        paires.push([a, b]);
      }
    }
  }
  return paires;
}

/**
 * URL de l'annonce avec les paramètres de campagne (utm_*) qui permettent à
 * l'annonceur de compter les visites venues du site, seule mesure possible
 * sans traceur. Une URL qui porte déjà un paramètre utm_ est laissée telle quelle.
 */
export function urlAvecUtm(url: string, idCampagne: string, hoteSite: string): string {
  const u = new URL(url);
  if ([...u.searchParams.keys()].some((k) => k.startsWith('utm_'))) return url;
  u.searchParams.set('utm_source', hoteSite);
  u.searchParams.set('utm_medium', 'publicite');
  u.searchParams.set('utm_campaign', idCampagne);
  return u.toString();
}

/** Veille d'une date AAAA-MM-JJ (calcul de calendrier, insensible aux changements d'heure). */
export function veille(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Heure à Paris (0 à 23) d'un instant. */
export function heureParis(instant: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(instant),
  );
}

/**
 * Le site doit-il être reconstruit ce jour-là ? Oui si la campagne affichée
 * change sur au moins un emplacement (ou une famille) entre la veille et le
 * jour, ou le 1er janvier (année du pied de page). Sinon, aucun build inutile.
 */
export function doitReconstruire<C extends CampagneSelection>(
  campagnes: readonly C[],
  emplacements: readonly string[],
  familles: readonly string[],
  hier: string,
  jour: string,
): boolean {
  if (jour.endsWith('-01-01')) return true;
  for (const emplacement of emplacements) {
    for (const famille of [undefined, ...familles]) {
      const avant = campagneActive(campagnes, emplacement, hier, famille)?.id ?? null;
      const apres = campagneActive(campagnes, emplacement, jour, famille)?.id ?? null;
      if (avant !== apres) return true;
    }
  }
  return false;
}

const hoteSansWww = (u: string): string => {
  try {
    // Point final (« abby.fr. », nom complètement qualifié) : même hôte.
    return new URL(u).hostname.replace(/\.$/, '').replace(/^www\./, '');
  } catch {
    return '';
  }
};

/**
 * Une URL mène-t-elle chez l'éditeur d'un logiciel comparé ? Domaine officiel
 * ou l'un de ses sous-domaines (lp.abby.fr pour abby.fr) : l'annonce doit
 * alors déclarer l'outil, ce qui la limite à l'accueil et aux guides.
 */
export function memeEditeur(url: string, urlOfficielle: string): boolean {
  const h = hoteSansWww(url);
  const o = hoteSansWww(urlOfficielle);
  return o !== '' && (h === o || h.endsWith(`.${o}`));
}
