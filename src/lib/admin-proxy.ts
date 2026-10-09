/**
 * Relais du back office vers l'API GitHub (fonction Netlify /admin/gh/*) :
 * les pages du site gardent connect-src 'self', et le relais ne laisse passer
 * que les routes de CE dépôt, les méthodes utiles et les en-têtes nécessaires.
 * Il ne détient aucun secret : le jeton de l'éditeur arrive dans la requête et
 * repart vers api.github.com seulement, sans jamais être journalisé.
 */

export const PREFIXE_RELAIS = '/admin/gh';
/** Seules branches que le back office crée, met en ligne ou supprime (cf. nomBranche). */
export const BRANCHE_BACK_OFFICE = /^back-office\/\d{8}-\d{6}-[0-9a-f]{4}$/;
const METHODES = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
/**
 * Écritures relayées, route par route (chemin relatif au dépôt). Les lectures
 * restent libres dans le dépôt ; toute autre écriture (tag, release, contenu,
 * réglages, branche principale) est refusée, même avec un jeton qui le permet.
 */
const ECRITURES: Record<string, RegExp> = {
  POST: /^\/(git\/(blobs|trees|commits|refs)|pulls)$/,
  PATCH: /^\/pulls\/\d+$/,
  PUT: /^\/pulls\/\d+\/merge$/,
  DELETE: /^\/git\/refs\/heads\/back-office\/\d{8}-\d{6}-[0-9a-f]{4}$/,
};
const CORPS_MAX = 5 * 1024 * 1024;
const ENTETES_RETOUR = [
  'content-type',
  'github-authentication-token-expiration',
  'x-oauth-scopes',
  'x-accepted-github-permissions',
  'x-ratelimit-remaining',
];

const erreur = (statut: number, message: string) =>
  new Response(JSON.stringify({ message }), {
    status: statut,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });

/** Chemin GitHub autorisé (sans query string), ou null. */
export function cheminAutorise(chemin: string, depot: string): string | null {
  const racine = `${PREFIXE_RELAIS}/repos/${depot}`;
  if (chemin !== racine && !chemin.startsWith(`${racine}/`)) return null;
  const reste = chemin.slice(PREFIXE_RELAIS.length);
  // Segments simples seulement : ni « .. », ni encodage de barre oblique.
  if (!/^\/repos\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._~-]+)*$/.test(reste)) return null;
  if (reste.split('/').some((s) => s === '.' || s === '..')) return null;
  return reste;
}

function lireObjet(corps: ArrayBuffer): Record<string, unknown> | null {
  try {
    const d: unknown = JSON.parse(new TextDecoder().decode(corps));
    return d !== null && typeof d === 'object' && !Array.isArray(d)
      ? (d as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Contrôle du corps des écritures sensibles : on ne crée et ne propose que des
 * branches back-office/AAAAMMJJ-HHMMSS-xxxx, et on ne modifie une demande que
 * pour la fermer (ni base, ni titre, ni corps).
 */
function corpsAutorise(methode: string, route: string, corps: ArrayBuffer): string | null {
  const estBranche = (v: unknown) => typeof v === 'string' && BRANCHE_BACK_OFFICE.test(v);
  if (methode === 'POST' && route === '/git/refs') {
    const ref = lireObjet(corps)?.['ref'];
    const prefixe = 'refs/heads/';
    const ok =
      typeof ref === 'string' && ref.startsWith(prefixe) && estBranche(ref.slice(prefixe.length));
    return ok ? null : 'Seule une branche back-office/… peut être créée.';
  }
  if (methode === 'POST' && route === '/pulls') {
    return estBranche(lireObjet(corps)?.['head'])
      ? null
      : 'Seule une branche back-office/… peut être proposée.';
  }
  if (methode === 'PATCH') {
    const d = lireObjet(corps);
    return d && Object.keys(d).length === 1 && d['state'] === 'closed'
      ? null
      : 'Seule la fermeture d’une demande est autorisée.';
  }
  return null;
}

export async function relayer(
  requete: Request,
  depot: string,
  f: typeof fetch = fetch,
): Promise<Response> {
  if (!METHODES.has(requete.method)) return erreur(405, 'Méthode non autorisée.');
  const url = new URL(requete.url);
  const origine = requete.headers.get('origin');
  if (origine !== null && origine !== url.origin) return erreur(403, 'Origine refusée.');
  const chemin = cheminAutorise(url.pathname, depot);
  if (!chemin) return erreur(404, 'Route non relayée.');
  const route = chemin.slice(`/repos/${depot}`.length);
  const ecriture = ECRITURES[requete.method];
  if (ecriture && (url.search !== '' || !ecriture.test(route))) {
    return erreur(403, 'Écriture non autorisée sur cette route.');
  }
  const auth = requete.headers.get('authorization') ?? '';
  if (!/^Bearer github_pat_[A-Za-z0-9_]{20,255}$/.test(auth)) {
    return erreur(401, 'Jeton GitHub à portée fine (github_pat_…) requis.');
  }

  let corps: ArrayBuffer | undefined;
  if (requete.method !== 'GET' && requete.method !== 'DELETE') {
    corps = await requete.arrayBuffer();
    if (corps.byteLength > CORPS_MAX) return erreur(413, 'Requête trop volumineuse.');
    const refus = corpsAutorise(requete.method, route, corps);
    if (refus) return erreur(403, refus);
  }

  let reponse: Response;
  try {
    reponse = await f(`https://api.github.com${chemin}${url.search}`, {
      method: requete.method,
      redirect: 'error',
      headers: {
        authorization: auth,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'back-office-affiliation-2027',
        ...(corps ? { 'content-type': 'application/json' } : {}),
      },
      ...(corps ? { body: corps } : {}),
    });
  } catch {
    return erreur(502, 'GitHub injoignable.');
  }

  const entetes = new Headers({ 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  for (const nom of ENTETES_RETOUR) {
    const v = reponse.headers.get(nom);
    if (v !== null) entetes.set(nom, v);
  }
  const contenu = reponse.status === 204 ? null : await reponse.arrayBuffer();
  return new Response(contenu, { status: reponse.status, headers: entetes });
}
