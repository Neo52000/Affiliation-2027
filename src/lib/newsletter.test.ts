import { describe, expect, it } from 'vitest';
import { API_BREVO_DOI, traiterInscription, type EnvNewsletter } from './newsletter';

const ENV: EnvNewsletter = {
  EMAIL_API_KEY: 'cle-brevo',
  NEWSLETTER_DOI_TEMPLATE_ID: '12',
  NEWSLETTER_LISTE_ID: '34',
};

const requete = (corps: string, entetes: Record<string, string> = {}, methode = 'POST'): Request =>
  new Request('https://site.example/api/newsletter', {
    method: methode,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://site.example',
      ...entetes,
    },
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

const OK = 'email=Pro%40Exemple.fr&consentement=oui&site_web=';

describe('traiterInscription', () => {
  it('inscription valide : double opt-in Brevo puis page « vérifiez vos emails »', async () => {
    const { f, appels } = fauxBrevo();
    const r = await traiterInscription(requete(OK), ENV, f);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('https://site.example/newsletter/verifiez-vos-emails');
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(appels).toHaveLength(1);
    expect(appels[0]!.url).toBe(API_BREVO_DOI);
    expect((appels[0]!.init.headers as Record<string, string>)['api-key']).toBe('cle-brevo');
    expect(JSON.parse(String(appels[0]!.init.body))).toEqual({
      email: 'pro@exemple.fr',
      includeListIds: [34],
      templateId: 12,
      redirectionUrl: 'https://site.example/newsletter/confirmee',
    });
  });

  it('champ piège rempli : même page qu’un humain, aucun email envoyé', async () => {
    const { f, appels } = fauxBrevo();
    const r = await traiterInscription(requete(`${OK}x`), ENV, f);
    expect(r.headers.get('location')).toMatch(/verifiez-vos-emails$/);
    expect(appels).toHaveLength(0);
  });

  it('sans consentement ou email invalide : page d’erreur, aucun appel', async () => {
    const { f, appels } = fauxBrevo();
    for (const corps of ['email=a%40b.fr', 'email=a%40b&consentement=oui']) {
      const r = await traiterInscription(requete(corps), ENV, f);
      expect(r.headers.get('location')).toMatch(/\/newsletter\/erreur$/);
    }
    expect(appels).toHaveLength(0);
  });

  it('configuration absente ou invalide : page « indisponible »', async () => {
    const { f, appels } = fauxBrevo();
    for (const env of [{}, { ...ENV, NEWSLETTER_LISTE_ID: 'abc' }, { ...ENV, EMAIL_API_KEY: '' }]) {
      const r = await traiterInscription(requete(OK), env, f);
      expect(r.headers.get('location')).toMatch(/indisponible$/);
    }
    expect(appels).toHaveLength(0);
  });

  it('échec ou panne de Brevo : page d’erreur', async () => {
    const r = await traiterInscription(requete(OK), ENV, fauxBrevo(400).f);
    expect(r.headers.get('location')).toMatch(/\/newsletter\/erreur$/);
    const panne = (async () => {
      throw new TypeError('réseau');
    }) as typeof fetch;
    expect((await traiterInscription(requete(OK), ENV, panne)).headers.get('location')).toMatch(
      /\/newsletter\/erreur$/,
    );
  });

  it('refuse une autre origine, une autre méthode ou un corps non formulaire', async () => {
    const { f } = fauxBrevo();
    expect(
      (await traiterInscription(requete(OK, { origin: 'https://evil.example' }), ENV, f)).status,
    ).toBe(403);
    expect((await traiterInscription(requete('', {}, 'GET'), ENV, f)).status).toBe(405);
    expect(
      (await traiterInscription(requete(OK, { 'content-type': 'application/json' }), ENV, f))
        .status,
    ).toBe(415);
  });
});
