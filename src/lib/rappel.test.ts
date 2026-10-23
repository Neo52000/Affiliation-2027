import { describe, expect, it } from 'vitest';
import { API_BREVO_DOI } from './newsletter';
import { traiterRappel, type EnvRappel } from './rappel';

const ENV: EnvRappel = {
  EMAIL_API_KEY: 'cle-brevo',
  EMAIL_DOI_TEMPLATE_ID: '12',
  EMAIL_LISTE_ID: '34',
};
const OK = JSON.stringify({ email: 'Pro@Exemple.fr', consentement: true, metier: 'plombier' });

const requete = (corps: string, entetes: Record<string, string> = {}, methode = 'POST') =>
  new Request('https://site.example/api/rappel', {
    method: methode,
    headers: { 'content-type': 'application/json', origin: 'https://site.example', ...entetes },
    ...(methode === 'POST' ? { body: corps } : {}),
  });

function fauxBrevo(statut = 201) {
  const appels: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    appels.push({ url, init });
    return new Response(null, { status: statut });
  }) as typeof fetch;
  return { f, appels };
}

describe('traiterRappel', () => {
  it('envoie la demande de double opt-in à Brevo et répond 200', async () => {
    const { f, appels } = fauxBrevo();
    const r = await traiterRappel(requete(OK), ENV, f);
    expect(r.status).toBe(200);
    expect(appels).toHaveLength(1);
    expect(appels[0]!.url).toBe(API_BREVO_DOI);
    const corps = JSON.parse(String(appels[0]!.init.body)) as Record<string, unknown>;
    expect(corps).toMatchObject({
      includeListIds: [34],
      templateId: 12,
      redirectionUrl: 'https://site.example/newsletter/rappel-confirme',
    });
    expect(corps['email']).toBe('pro@exemple.fr');
    expect(corps['attributes']).toEqual({ METIER: 'plombier' });
  });

  it.each([
    ['une autre origine', requete(OK, { origin: 'https://evil.example' }), 403],
    [
      'un corps text/plain (requête simple depuis un autre site)',
      requete(OK, { 'content-type': 'text/plain' }),
      415,
    ],
    ['un corps trop long', requete(JSON.stringify({ email: 'a@b.fr', x: 'y'.repeat(3000) })), 413],
    ['un JSON invalide', requete('{pas du json'), 400],
    ['sans consentement', requete(JSON.stringify({ email: 'a@b.fr', consentement: false })), 400],
    ['une autre méthode', requete('', {}, 'GET'), 405],
  ])('refuse %s sans appeler Brevo', async (_cas, r, statut) => {
    const { f, appels } = fauxBrevo();
    expect((await traiterRappel(r, ENV, f)).status).toBe(statut);
    expect(appels).toEqual([]);
  });

  it('répond 503 tant que Brevo n’est pas configuré', async () => {
    const { f, appels } = fauxBrevo();
    expect((await traiterRappel(requete(OK), {}, f)).status).toBe(503);
    expect(appels).toEqual([]);
  });

  it('répond 502 en JSON si Brevo est injoignable ou refuse', async () => {
    const enPanne = (async () => {
      throw new Error('réseau');
    }) as typeof fetch;
    const r = await traiterRappel(requete(OK), ENV, enPanne);
    expect(r.status).toBe(502);
    expect(r.headers.get('content-type')).toContain('application/json');
    expect((await traiterRappel(requete(OK), ENV, fauxBrevo(400).f)).status).toBe(502);
  });
});
