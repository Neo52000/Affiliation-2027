import { describe, expect, it } from 'vitest';
import {
  base64VersTexte,
  clientGitHub,
  ErreurGitHub,
  lireExpiration,
  nomBranche,
  octetsVersBase64,
  syntheseCi,
  type Publication,
} from './github-admin';

const depot = { proprietaire: 'Proprio', nom: 'Depot', branche: 'main' };
const BASE = '/admin/gh/repos/Proprio/Depot';
const MAINTENANT = new Date('2026-11-02T08:00:00Z');
const toujours = () => true;
const BRANCHE = 'back-office/20261102-080000-a1b2';

type Route = (corps: unknown) => [number, unknown, Record<string, string>?];

/** Faux relais : enregistre chaque appel et répond selon la route. */
function fauxFetch(routes: Record<string, Route>) {
  const appels: { methode: string; url: string; corps: unknown; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit = {}) => {
    const methode = init.method ?? 'GET';
    const corps = init.body ? JSON.parse(String(init.body)) : undefined;
    appels.push({ methode, url, corps, init });
    const route = routes[`${methode} ${url.replace(BASE, '')}`];
    if (!route) {
      return new Response(JSON.stringify({ message: `route inconnue ${url}` }), { status: 404 });
    }
    const [statut, reponse, entetes] = route(corps);
    return new Response(statut === 204 ? null : JSON.stringify(reponse), {
      status: statut,
      headers: entetes ?? {},
    });
  }) as typeof fetch;
  return { f, appels };
}

const client = (routes: Record<string, Route>) => {
  const { f, appels } = fauxFetch(routes);
  return { c: clientGitHub('github_pat_x', depot, { f, maintenant: () => MAINTENANT }), appels };
};

describe('encodage', () => {
  it('aller-retour UTF-8 (accents, guillemets français, emoji)', () => {
    const texte = '{"titre": "Offre « spéciale » — été ☀️"}\n';
    expect(base64VersTexte(octetsVersBase64(new TextEncoder().encode(texte)))).toBe(texte);
  });

  it('encode un gros fichier binaire sans dépasser la pile', () => {
    const octets = new Uint8Array(300 * 1024).map((_, i) => i % 256);
    expect(Uint8Array.from(atob(octetsVersBase64(octets)), (c) => c.charCodeAt(0))).toEqual(octets);
  });
});

describe('utilitaires', () => {
  it.each([
    [[], 'absente'],
    [[{ status: 'queued', conclusion: null }], 'en_attente'],
    [[{ status: 'in_progress', conclusion: null }], 'en_cours'],
    [[{ status: 'completed', conclusion: 'success' }], 'reussie'],
    [[{ status: 'completed', conclusion: 'failure' }], 'echouee'],
  ] as const)('syntheseCi %j → %s', (runs, attendu) => {
    expect(syntheseCi([...runs])).toBe(attendu);
  });

  it('nomBranche horodate en UTC et ajoute un suffixe', () => {
    expect(nomBranche(new Date('2026-11-02T08:05:09Z'), 'a1b2')).toBe(
      'back-office/20261102-080509-a1b2',
    );
  });

  it('lireExpiration comprend le format de GitHub', () => {
    expect(lireExpiration('2026-12-01 10:00:00 UTC')?.toISOString()).toBe(
      '2026-12-01T10:00:00.000Z',
    );
    expect(lireExpiration(null)).toBeNull();
    expect(lireExpiration('jamais')).toBeNull();
  });
});

describe('verifierAcces', () => {
  const depotOk: Route = () => [
    200,
    { permissions: { push: true } },
    { 'github-authentication-token-expiration': '2026-12-01 10:00:00 UTC' },
  ];

  it('accepte un jeton à portée fine, en écriture, qui expire sous 90 jours', async () => {
    const { c, appels } = client({ 'GET ': depotOk });
    expect((await c.verifierAcces()).expiration.toISOString()).toBe('2026-12-01T10:00:00.000Z');
    expect(appels[0]!.url).toBe(BASE);
    expect(appels[0]!.init).toMatchObject({
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    });
  });

  it.each([
    [
      'jeton classique',
      () => [200, { permissions: { push: true } }, { 'x-oauth-scopes': 'repo' }],
      /classique/,
    ],
    ['sans droit d’écriture', () => [200, { permissions: { push: false } }], /écrire/],
    ['sans expiration', () => [200, { permissions: { push: true } }], /sans expiration/],
    [
      'expiration trop lointaine',
      () => [
        200,
        { permissions: { push: true } },
        { 'github-authentication-token-expiration': '2027-12-01 10:00:00 UTC' },
      ],
      /90 jours/,
    ],
  ] as [string, Route, RegExp][])('refuse : %s', async (_, route, motif) => {
    const { c } = client({ 'GET ': route });
    await expect(c.verifierAcces()).rejects.toThrow(motif);
  });
});

describe('reglesManquantes', () => {
  it('liste les règles absentes de main, dont le contrôle « verify »', async () => {
    const { c } = client({
      'GET /rules/branches/main': () => [
        200,
        [
          { type: 'pull_request' },
          {
            type: 'required_status_checks',
            parameters: { required_status_checks: [{ context: 'autre' }] },
          },
        ],
      ],
    });
    expect(await c.reglesManquantes()).toEqual([
      'deletion',
      'non_fast_forward',
      'contrôle requis « verify »',
    ]);
  });
});

describe('publier', () => {
  const routes = (shaMain: string): Record<string, Route> => {
    let blobs = 0;
    return {
      'GET /contents/src/data/publicites.json?ref=main': () => [200, { sha: shaMain }],
      'GET /git/ref/heads/main': () => [200, { object: { sha: 'parent' } }],
      'GET /git/commits/parent': () => [200, { tree: { sha: 'arbre-parent' } }],
      'POST /git/blobs': () => [201, { sha: `blob-${++blobs}` }],
      'POST /git/trees': () => [201, { sha: 'arbre' }],
      'POST /git/commits': () => [201, { sha: 'commit' }],
      'POST /git/refs': () => [201, {}],
      'POST /pulls': () => [
        201,
        { number: 42, html_url: 'https://github.com/x/pull/42', title: 't' },
      ],
    };
  };
  const fichiers = [
    { chemin: 'src/data/publicites.json', contenu: '{}\n' },
    { chemin: 'src/assets/publicites/a.webp', contenu: new Uint8Array([1, 2, 3]) },
    { chemin: 'src/assets/publicites/ancienne.webp', contenu: null },
  ];

  it('un commit unique (écriture et suppression), une branche suffixée, la pull request', async () => {
    const { c, appels } = client(routes('sha-charge'));
    const pub = await c.publier(
      fichiers,
      { 'src/data/publicites.json': 'sha-charge' },
      toujours,
      'Back office : publicités',
      'corps',
      new Date('2026-11-02T08:05:09Z'),
    );
    expect(pub.numero).toBe(42);
    expect(pub.sha).toBe('commit');
    expect(pub.branche).toMatch(/^back-office\/20261102-080509-[0-9a-f]{4}$/);
    expect(pub.chemins).toEqual(fichiers.map((x) => x.chemin));
    const arbre = appels.find((a) => a.url.endsWith('/git/trees'))!.corps as {
      base_tree: string;
      tree: { path: string; sha: string | null }[];
    };
    expect(arbre.base_tree).toBe('arbre-parent');
    expect(arbre.tree.map((t) => [t.path, t.sha])).toEqual([
      ['src/data/publicites.json', 'blob-1'],
      ['src/assets/publicites/a.webp', 'blob-2'],
      ['src/assets/publicites/ancienne.webp', null],
    ]);
  });

  it('refuse si main a changé depuis le chargement (aucune écriture)', async () => {
    const { c, appels } = client(routes('sha-nouveau'));
    await expect(
      c.publier(
        fichiers,
        { 'src/data/publicites.json': 'sha-charge' },
        toujours,
        'm',
        'c',
        MAINTENANT,
      ),
    ).rejects.toMatchObject({ statut: 409 });
    expect(appels.some((a) => a.methode === 'POST')).toBe(false);
  });

  it('refuse une publication qui ne change rien (aucune branche, aucune demande)', async () => {
    const { c, appels } = client({
      ...routes('sha-charge'),
      'POST /git/trees': () => [201, { sha: 'arbre-parent' }],
    });
    await expect(
      c.publier(
        fichiers,
        { 'src/data/publicites.json': 'sha-charge' },
        toujours,
        'm',
        'c',
        MAINTENANT,
      ),
    ).rejects.toThrow(/aucun changement réel/);
    expect(appels.some((a) => /\/git\/(commits|refs)$|\/pulls$/.test(a.url))).toBe(false);
  });

  it('refuse un chemin hors de la liste autorisée', async () => {
    const { c } = client(routes('s'));
    await expect(
      c.publier(
        [{ chemin: 'netlify/functions/x.mts', contenu: '' }],
        {},
        (ch) => ch.startsWith('src/data/'),
        'm',
        'c',
        MAINTENANT,
      ),
    ).rejects.toBeInstanceOf(ErreurGitHub);
  });
});

describe('chemins et publications ouvertes', () => {
  it.each([
    'src/%2e%2e/%2e%2e/x.json',
    'src/../x.json',
    'src/./x.json',
    'src//x.json',
    'https://exemple.fr/x.json',
    'src/x.json#a',
  ])('refuse le chemin %s sans aucun appel', async (chemin) => {
    const { c, appels } = client({});
    await expect(c.lireFichier(chemin)).rejects.toThrow(/chemin refusé/);
    expect(appels).toHaveLength(0);
  });

  it('ne garde que les demandes back-office/… issues de ce dépôt', async () => {
    const demande = (numero: number, ref: string, depotTete: string | null) => ({
      number: numero,
      html_url: `https://github.com/Proprio/Depot/pull/${numero}`,
      title: `n° ${numero}`,
      head: { ref, sha: `sha${numero}`, repo: depotTete ? { full_name: depotTete } : null },
    });
    const { c } = client({
      'GET /pulls?state=open&per_page=30': () => [
        200,
        [
          demande(1, BRANCHE, 'Proprio/Depot'),
          demande(2, BRANCHE, 'Tiers/Depot'),
          demande(3, 'back-office/%2e%2e/%2e%2e/tags/v1.0', 'Proprio/Depot'),
          demande(4, 'back-office/%2e%2e/%2e%2e/tags/v1.0', 'Tiers/Depot'),
          demande(5, 'back-office/x', 'Proprio/Depot'),
          demande(6, BRANCHE, null),
          demande(7, 'claude/autre', 'Proprio/Depot'),
        ],
      ],
    });
    expect(await c.publicationsOuvertes()).toEqual([
      {
        numero: 1,
        url: 'https://github.com/Proprio/Depot/pull/1',
        branche: BRANCHE,
        sha: 'sha1',
        titre: 'n° 1',
        chemins: null,
      },
    ]);
  });
});

describe('etat et mise en ligne', () => {
  const pub: Publication = {
    numero: 7,
    url: '',
    branche: BRANCHE,
    sha: 'c0ffee',
    titre: '',
    chemins: ['src/data/affiliation.json'],
  };
  const pr =
    (p: Partial<Record<string, unknown>> = {}): Route =>
    () => [
      200,
      {
        state: 'open',
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        base: { ref: 'main' },
        head: { ref: BRANCHE, sha: 'c0ffee', repo: { full_name: 'Proprio/Depot' } },
        ...p,
      },
    ];
  const run = (p: Partial<Record<string, unknown>> = {}) => ({
    status: 'completed',
    conclusion: 'success',
    path: '.github/workflows/ci.yml',
    head_branch: BRANCHE,
    head_sha: 'c0ffee',
    ...p,
  });
  const routes = (
    prRoute: Route,
    fichiers: string[] = ['src/data/affiliation.json'],
    runs: unknown[] = [run()],
  ): Record<string, Route> => ({
    'GET /pulls/7': prRoute,
    'GET /pulls/7/files?per_page=100': () => [200, fichiers.map((filename) => ({ filename }))],
    'GET /actions/runs?head_sha=c0ffee&event=pull_request&per_page=20': () => [
      200,
      { workflow_runs: runs },
    ],
  });
  const autorise = (ch: string) =>
    ch.startsWith('src/data/') || ch.startsWith('src/assets/publicites/');

  it('prête : tête inchangée, fichiers attendus, CI du dépôt verte, branche propre', async () => {
    const { c } = client(routes(pr()));
    expect(await c.etat(pub, autorise)).toEqual({
      ouverte: true,
      fusionnee: false,
      ci: 'reussie',
      blocages: [],
    });
  });

  it.each([
    [
      'commit ajouté',
      routes(pr({ head: { ref: BRANCHE, sha: 'autre', repo: { full_name: 'Proprio/Depot' } } })),
      /autre commit/,
    ],
    [
      'fichier de code',
      routes(pr(), ['src/data/affiliation.json', 'package.json']),
      /hors des données/,
    ],
    ['fichier inattendu', routes(pr(), ['src/data/publicites.json']), /ne sont pas ceux/],
    ['aucun fichier', routes(pr(), []), /ne sont pas ceux/],
    [
      'CI d’un autre workflow',
      routes(pr(), undefined, [run({ path: '.github/workflows/autre.yml' })]),
      /non réussies/,
    ],
    ['CI en échec', routes(pr(), undefined, [run({ conclusion: 'failure' })]), /non réussies/],
    ['branche en retard', routes(pr({ mergeable_state: 'behind' })), /behind/],
    ['conflit', routes(pr({ mergeable: false, mergeable_state: 'dirty' })), /conflit/],
  ] as [string, Record<string, Route>, RegExp][])('bloquée : %s', async (_, r, motif) => {
    const { c } = client(r);
    const e = await c.etat(pub, autorise);
    expect(e.blocages.join(' | ')).toMatch(motif);
  });

  it('image renvoyée à l’identique : absente des fichiers de la demande, pas de blocage', async () => {
    const { c } = client(routes(pr()));
    const avecImage = { ...pub, chemins: [...pub.chemins!, 'src/assets/publicites/promo.webp'] };
    expect((await c.etat(avecImage, autorise)).blocages).toEqual([]);
  });

  it('met en ligne avec le sha créé, en squash, puis supprime la branche', async () => {
    const { c, appels } = client({
      'PUT /pulls/7/merge': () => [200, { merged: true }],
      [`DELETE /git/refs/heads/${BRANCHE}`]: () => [204, null],
    });
    await c.mettreEnLigne(pub);
    expect(appels[0]!.corps).toEqual({ sha: 'c0ffee', merge_method: 'squash' });
    expect(appels[1]!.methode).toBe('DELETE');
    expect(appels[1]!.url).toBe(`${BASE}/git/refs/heads/${BRANCHE}`);
  });

  it('ne supprime jamais une branche hors du format back-office', async () => {
    const { c, appels } = client({ 'PUT /pulls/7/merge': () => [200, { merged: true }] });
    await c.mettreEnLigne({ ...pub, branche: 'back-office/%2e%2e/%2e%2e/tags/v1.0' });
    expect(appels.map((a) => a.methode)).toEqual(['PUT']);
  });

  it('abandon : ferme la demande puis supprime sa branche, confirmée par GitHub', async () => {
    const { c, appels } = client({
      'PATCH /pulls/7': () => [
        200,
        { head: { ref: BRANCHE, repo: { full_name: 'Proprio/Depot' } } },
      ],
      [`DELETE /git/refs/heads/${BRANCHE}`]: () => [204, null],
    });
    await c.abandonner(pub);
    expect(appels[0]!.corps).toEqual({ state: 'closed' });
    expect(appels.map((a) => `${a.methode} ${a.url.replace(BASE, '')}`)).toEqual([
      'PATCH /pulls/7',
      `DELETE /git/refs/heads/${BRANCHE}`,
    ]);
  });

  it.each([
    ['depuis un fork', { ref: BRANCHE, repo: { full_name: 'Tiers/Depot' } }],
    ['fork supprimé', { ref: BRANCHE, repo: null }],
    [
      'autre branche',
      { ref: 'back-office/20261102-080000-ffff', repo: { full_name: 'Proprio/Depot' } },
    ],
  ])('abandon %s : demande fermée, aucune branche supprimée', async (_, head) => {
    const { c, appels } = client({ 'PATCH /pulls/7': () => [200, { head }] });
    await c.abandonner(pub);
    expect(appels.map((a) => a.methode)).toEqual(['PATCH']);
  });

  it('remonte le message d’erreur et la permission attendue', async () => {
    const { f } = fauxFetch({
      'GET /contents/x.json?ref=main': () => [
        403,
        { message: 'Resource not accessible' },
        { 'x-accepted-github-permissions': 'contents=read' },
      ],
    });
    await expect(clientGitHub('j', depot, { f }).lireFichier('x.json')).rejects.toThrow(
      /permission attendue : contents=read/,
    );
  });
});
