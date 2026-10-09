/**
 * Relais du back office vers l'API GitHub (fonction Netlify /admin/gh/*) :
 * les pages du site gardent connect-src 'self', et le relais ne laisse passer
 * que les routes de CE dépôt, les méthodes utiles et les en-têtes nécessaires.
 * Il ne détient aucun secret : le jeton de l'éditeur arrive dans la requête et
 * repart vers api.github.com seulement, sans jamais être journalisé.
 */

export const PREFIXE_RELAIS = '/admin/gh';
const METHODES = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
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
  const auth = requete.headers.get('authorization') ?? '';
  if (!/^Bearer github_pat_[A-Za-z0-9_]{20,255}$/.test(auth)) {
    return erreur(401, 'Jeton GitHub à portée fine (github_pat_…) requis.');
  }

  let corps: ArrayBuffer | undefined;
  if (requete.method !== 'GET' && requete.method !== 'DELETE') {
    corps = await requete.arrayBuffer();
    if (corps.byteLength > CORPS_MAX) return erreur(413, 'Requête trop volumineuse.');
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
