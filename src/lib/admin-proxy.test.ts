import { describe, expect, it } from 'vitest';
import { cheminAutorise, relayer } from './admin-proxy';

const DEPOT = 'Neo52000/Affiliation-2027';
const JETON = `github_pat_${'A'.repeat(30)}`;

const requete = (chemin: string, init: RequestInit = {}) =>
  new Request(`https://site.example${chemin}`, {
    ...init,
    headers: { authorization: `Bearer ${JETON}`, ...(init.headers as Record<string, string>) },
  });

function fauxGitHub(statut = 200, entetes: Record<string, string> = {}) {
  const appels: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    appels.push({ url, init });
    return new Response(statut === 204 ? null : '{"ok":true}', {
      status: statut,
      headers: { 'content-type': 'application/json', 'set-cookie': 'x=1', ...entetes },
    });
  }) as typeof fetch;
  return { f, appels };
}

describe('cheminAutorise', () => {
  it.each([
    ['/admin/gh/repos/Neo52000/Affiliation-2027', '/repos/Neo52000/Affiliation-2027'],
    [
      '/admin/gh/repos/Neo52000/Affiliation-2027/git/refs',
      '/repos/Neo52000/Affiliation-2027/git/refs',
    ],
  ])('relaie %s', (chemin, attendu) => {
    expect(cheminAutorise(chemin, DEPOT)).toBe(attendu);
  });

  it.each([
    '/admin/gh/repos/autre/depot',
    '/admin/gh/repos/Neo52000/Affiliation-2027-copie/contents/x',
    '/admin/gh/repos/Neo52000/Affiliation-2027/../../user',
    '/admin/gh/repos/Neo52000/Affiliation-2027/contents/a%2F..%2Fb',
    '/admin/gh/user',
    '/admin/gh/gists',
  ])('refuse %s', (chemin) => {
    expect(cheminAutorise(chemin, DEPOT)).toBeNull();
  });
});

describe('relayer', () => {
  it('transmet jeton, méthode, corps et query string à api.github.com seulement', async () => {
    const { f, appels } = fauxGitHub(201, {
      'github-authentication-token-expiration': '2026-12-01',
    });
    const r = await relayer(
      requete(`/admin/gh/repos/${DEPOT}/git/blobs`, {
        method: 'POST',
        body: '{"content":"YQ=="}',
        headers: { origin: 'https://site.example', cookie: 'session=1' },
      }),
      DEPOT,
      f,
    );
    expect(r.status).toBe(201);
    expect(appels[0]!.url).toBe(`https://api.github.com/repos/${DEPOT}/git/blobs`);
    const h = appels[0]!.init.headers as Record<string, string>;
    expect(h['authorization']).toBe(`Bearer ${JETON}`);
    expect(h['cookie']).toBeUndefined();
    expect(appels[0]!.init.redirect).toBe('error');
    expect(r.headers.get('github-authentication-token-expiration')).toBe('2026-12-01');
    expect(r.headers.get('set-cookie')).toBeNull();
    expect(r.headers.get('cache-control')).toBe('no-store');
  });

  it('refuse sans jeton à portée fine, hors dépôt, autre origine ou méthode', async () => {
    const { f, appels } = fauxGitHub();
    const sansJeton = new Request(`https://site.example/admin/gh/repos/${DEPOT}`);
    expect((await relayer(sansJeton, DEPOT, f)).status).toBe(401);
    const classique = new Request(`https://site.example/admin/gh/repos/${DEPOT}`, {
      headers: { authorization: `Bearer ghp_${'A'.repeat(36)}` },
    });
    expect((await relayer(classique, DEPOT, f)).status).toBe(401);
    expect((await relayer(requete('/admin/gh/repos/autre/depot'), DEPOT, f)).status).toBe(404);
    expect(
      (
        await relayer(
          requete(`/admin/gh/repos/${DEPOT}/pulls`, {
            method: 'POST',
            body: '{}',
            headers: { origin: 'https://evil.example' },
          }),
          DEPOT,
          f,
        )
      ).status,
    ).toBe(403);
    expect(
      (await relayer(requete(`/admin/gh/repos/${DEPOT}`, { method: 'HEAD' }), DEPOT, f)).status,
    ).toBe(405);
    expect(appels).toHaveLength(0);
  });

  it('transmet la query string des lectures', async () => {
    const { f, appels } = fauxGitHub();
    const r = await relayer(requete(`/admin/gh/repos/${DEPOT}/pulls?state=open`), DEPOT, f);
    expect(r.status).toBe(200);
    expect(appels[0]!.url).toBe(`https://api.github.com/repos/${DEPOT}/pulls?state=open`);
  });
});

describe('relayer : écritures', () => {
  const BRANCHE = 'back-office/20261102-080000-a1b2';
  const ecrire = (methode: string, route: string, corps?: unknown) =>
    requete(`/admin/gh/repos/${DEPOT}${route}`, {
      method: methode,
      ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
    });

  it.each([
    ['POST', '/git/blobs', { content: 'YQ==', encoding: 'base64' }],
    ['POST', '/git/trees', { tree: [] }],
    ['POST', '/git/commits', { message: 'm', tree: 't', parents: [] }],
    ['POST', '/git/refs', { ref: `refs/heads/${BRANCHE}`, sha: 'c0ffee' }],
    ['POST', '/pulls', { title: 't', head: BRANCHE, base: 'main', body: '' }],
    ['PATCH', '/pulls/7', { state: 'closed' }],
    ['PUT', '/pulls/7/merge', { sha: 'c0ffee', merge_method: 'squash' }],
    ['DELETE', `/git/refs/heads/${BRANCHE}`, undefined],
  ])('relaie %s %s', async (methode, route, corps) => {
    const { f, appels } = fauxGitHub();
    expect((await relayer(ecrire(methode, route, corps), DEPOT, f)).status).toBe(200);
    expect(appels).toHaveLength(1);
  });

  it.each([
    ['DELETE', '/git/refs/tags/v1.0', undefined],
    ['DELETE', '/git/refs/heads/main', undefined],
    ['DELETE', '/git/refs/heads/back-office/x', undefined],
    ['DELETE', '/releases/1', undefined],
    ['DELETE', '', undefined],
    ['PUT', '/contents/src/data/affiliation.json', { content: 'YQ==' }],
    ['PATCH', '/git/refs/heads/main', { sha: 'c0ffee', force: true }],
    ['PATCH', '', { private: false }],
    ['PATCH', '/pulls/7', { state: 'closed', base: 'autre' }],
    ['PATCH', '/pulls/7', { title: 'autre' }],
    ['POST', '/git/refs', { ref: 'refs/heads/main', sha: 'c0ffee' }],
    ['POST', '/git/refs', { ref: 'refs/tags/v9', sha: 'c0ffee' }],
    ['POST', '/git/refs', { ref: `refs/heads/${BRANCHE}/../main`, sha: 'c0ffee' }],
    ['POST', '/pulls', { title: 't', head: 'main', base: 'autre' }],
    ['POST', '/releases', { tag_name: 'v9' }],
    ['POST', '/dispatches', { event_type: 'x' }],
    ['POST', `/git/blobs?x=1`, { content: 'YQ==' }],
  ])('refuse %s %s', async (methode, route, corps) => {
    const { f, appels } = fauxGitHub();
    expect((await relayer(ecrire(methode, route, corps), DEPOT, f)).status).toBe(403);
    expect(appels).toHaveLength(0);
  });

  it('refuse un nom de branche piégé que le navigateur normalise (%2e%2e)', async () => {
    const { f, appels } = fauxGitHub();
    const piege = ecrire('DELETE', '/git/refs/heads/back-office/%2e%2e/%2e%2e/tags/v1.0');
    expect(new URL(piege.url).pathname).toBe(`/admin/gh/repos/${DEPOT}/git/refs/tags/v1.0`);
    expect((await relayer(piege, DEPOT, f)).status).toBe(403);
    expect(appels).toHaveLength(0);
  });
});
