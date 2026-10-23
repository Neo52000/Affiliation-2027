/**
 * Mesure d'audience sans cookie ni donnée personnelle (TODO.md #35) : trois
 * événements agrégés, « quiz commencé », « quiz terminé » et « clic vers un
 * éditeur », reçus par
 * la fonction Netlify /api/mesure et rangés dans Netlify Blobs. Chaque
 * événement est une clé vide `AAAA-MM-JJ/type/outil/emplacement/id` : ni IP, ni
 * navigateur, ni page d'origine, ni identifiant de visiteur ; l'id aléatoire
 * n'existe que pour ne jamais écraser un événement concurrent. La lecture des
 * totaux (GET) exige le jeton GitHub du back office, avec droit d'écriture sur
 * le dépôt.
 */
import donnees from '../data/affiliation.json';

export const TYPES_MESURE = ['quiz_commence', 'quiz_termine', 'clic_editeur'] as const;
export type TypeMesure = (typeof TYPES_MESURE)[number];

/**
 * Valeur d'`outil` pour un événement du quiz sans logiciel : quiz commencé, ou
 * terminé sans logiciel compatible. Jamais accepté pour un clic éditeur.
 */
export const SANS_OUTIL = 'aucun';

/** Outils connus : ceux d'affiliation.json, une entrée par fiche logiciel. */
export const OUTILS_MESURE: ReadonlySet<string> = new Set(Object.keys(donnees.liens));

/** Emplacements : ceux des boutons (`data-emplacement`), slugs compris. */
const EMPLACEMENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMPLACEMENT_MAX = 100;
const CORPS_MAX = 1000;
/** Fenêtre de lecture : 90 jours au plus. */
export const JOURS_MAX = 90;

export interface Evenement {
  type: TypeMesure;
  outil: string;
  emplacement: string;
}

export function validerEvenement(corps: unknown, outils = OUTILS_MESURE): Evenement | null {
  if (corps === null || typeof corps !== 'object' || Array.isArray(corps)) return null;
  const { type, outil, emplacement } = corps as Record<string, unknown>;
  if (typeof type !== 'string' || !(TYPES_MESURE as readonly string[]).includes(type)) return null;
  const sansOutilPermis = type !== 'clic_editeur' && outil === SANS_OUTIL;
  if (typeof outil !== 'string' || !(outils.has(outil) || sansOutilPermis)) return null;
  if (type === 'quiz_commence' && outil !== SANS_OUTIL) return null;
  if (
    typeof emplacement !== 'string' ||
    emplacement.length > EMPLACEMENT_MAX ||
    !EMPLACEMENT.test(emplacement)
  ) {
    return null;
  }
  return { type: type as TypeMesure, outil, emplacement };
}

const jourIso = (d: Date) => d.toISOString().slice(0, 10);

export const cleEvenement = (e: Evenement, date: Date, id: string) =>
  `${jourIso(date)}/${e.type}/${e.outil}/${e.emplacement}/${id}`;

export interface Total {
  jour: string;
  type: TypeMesure;
  outil: string;
  emplacement: string;
  n: number;
}

/** Totaux par jour, type, outil et emplacement ; les clés malformées sont ignorées. */
export function agreger(cles: readonly string[]): Total[] {
  const totaux = new Map<string, Total>();
  for (const cle of cles) {
    const [jour, type, outil, emplacement, id] = cle.split('/');
    if (!jour || !id || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) continue;
    const e = validerEvenement({ type, outil, emplacement }, new Set([outil ?? '']));
    if (!e) continue;
    const k = `${jour}/${e.type}/${e.outil}/${e.emplacement}`;
    const t = totaux.get(k);
    if (t) t.n += 1;
    else totaux.set(k, { jour, ...e, n: 1 });
  }
  return [...totaux.values()].sort(
    (a, b) =>
      b.jour.localeCompare(a.jour) ||
      a.type.localeCompare(b.type) ||
      a.outil.localeCompare(b.outil) ||
      a.emplacement.localeCompare(b.emplacement),
  );
}

/** Sous-ensemble de l'API Netlify Blobs utilisé ici (remplaçable en test). */
export interface MagasinMesure {
  set(cle: string, valeur: string): Promise<unknown>;
  list(options: { prefix: string }): Promise<{ blobs: { key: string }[] }>;
}

export interface DependancesMesure {
  magasin: MagasinMesure;
  /** true si le jeton peut écrire dans le dépôt du site (droits du back office). */
  verifierJeton: (jeton: string) => Promise<boolean>;
  maintenant?: () => Date;
  id?: () => string;
}

const SANS_CACHE = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const reponse = (statut: number, corps: string | null = null, entetes = {}) =>
  new Response(corps, { status: statut, headers: { ...SANS_CACHE, ...entetes } });
const json = (statut: number, valeur: unknown) =>
  reponse(statut, JSON.stringify(valeur), { 'content-type': 'application/json; charset=utf-8' });

export async function traiterMesure(requete: Request, d: DependancesMesure): Promise<Response> {
  const maintenant = d.maintenant ?? (() => new Date());
  if (requete.method === 'POST') return enregistrer(requete, d, maintenant());
  if (requete.method === 'GET') return lire(requete, d, maintenant());
  return reponse(405, null, { allow: 'GET, POST' });
}

async function enregistrer(requete: Request, d: DependancesMesure, date: Date) {
  const origineAppelante = requete.headers.get('origin');
  if (origineAppelante !== null && origineAppelante !== new URL(requete.url).origin) {
    return reponse(403);
  }
  const texte = await requete.text();
  if (texte.length > CORPS_MAX) return reponse(413);
  let corps: unknown;
  try {
    corps = JSON.parse(texte);
  } catch {
    return reponse(400);
  }
  const e = validerEvenement(corps);
  if (!e) return reponse(400);
  const id = d.id?.() ?? crypto.randomUUID();
  await d.magasin.set(cleEvenement(e, date, id), '');
  return reponse(204);
}

async function lire(requete: Request, d: DependancesMesure, date: Date) {
  const auth = requete.headers.get('authorization') ?? '';
  const jeton = /^Bearer (github_pat_[A-Za-z0-9_]+)$/.exec(auth)?.[1];
  if (!jeton || !(await d.verifierJeton(jeton))) return json(401, { message: 'Jeton refusé.' });
  const demande = Number(new URL(requete.url).searchParams.get('jours') ?? 30);
  const jours = Number.isInteger(demande) && demande > 0 ? Math.min(demande, JOURS_MAX) : 30;
  const prefixes = Array.from({ length: jours }, (_, i) =>
    jourIso(new Date(date.getTime() - i * 86_400_000)),
  );
  const listes = await Promise.all(prefixes.map((p) => d.magasin.list({ prefix: `${p}/` })));
  return json(200, { jours, totaux: agreger(listes.flatMap((l) => l.blobs.map((b) => b.key))) });
}

/** Vérifie auprès de GitHub que le jeton peut écrire dans le dépôt (permissions.push). */
export function verificateurGitHub(depot: string, f: typeof fetch = fetch) {
  return async (jeton: string): Promise<boolean> => {
    const r = await f(`https://api.github.com/repos/${depot}`, {
      headers: {
        authorization: `Bearer ${jeton}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
      },
    });
    if (!r.ok) return false;
    const corps = (await r.json()) as { permissions?: { push?: boolean } };
    return corps.permissions?.push === true;
  };
}
