import { describe, expect, it } from 'vitest';
import {
  agreger,
  cleEvenement,
  traiterMesure,
  validerEvenement,
  verificateurGitHub,
  type MagasinMesure,
} from './mesure';

const DATE = new Date('2026-10-23T10:00:00Z');

function fauxMagasin(cles: string[] = []) {
  const ecrites: string[] = [];
  const magasin: MagasinMesure = {
    set: async (cle) => {
      ecrites.push(cle);
    },
    list: async ({ prefix }) => ({
      blobs: [...cles, ...ecrites].filter((k) => k.startsWith(prefix)).map((key) => ({ key })),
    }),
  };
  return { magasin, ecrites };
}

const deps = (magasin: MagasinMesure, jetonValide = true) => ({
  magasin,
  verifierJeton: async () => jetonValide,
  maintenant: () => DATE,
  id: () => 'x1',
});

const post = (corps: string, entetes: Record<string, string> = {}) =>
  new Request('https://site.example/api/mesure', {
    method: 'POST',
    headers: { 'content-type': 'text/plain', ...entetes },
    body: corps,
  });

const OK = JSON.stringify({ type: 'clic_editeur', outil: 'abby', emplacement: 'fiche-abby' });

describe('validerEvenement', () => {
  it('accepte un événement connu', () => {
    expect(validerEvenement({ type: 'quiz_termine', outil: 'tiime', emplacement: 'quiz' })).toEqual(
      { type: 'quiz_termine', outil: 'tiime', emplacement: 'quiz' },
    );
  });

  it.each([
    [null],
    [[]],
    [{ type: 'visite', outil: 'abby', emplacement: 'quiz' }],
    [{ type: 'clic_editeur', outil: 'inconnu', emplacement: 'quiz' }],
    [{ type: 'clic_editeur', outil: 'abby', emplacement: 'Quiz/../x' }],
    [{ type: 'clic_editeur', outil: 'abby', emplacement: 'a'.repeat(101) }],
    [{ type: 'clic_editeur', outil: 'abby' }],
  ])('refuse %j', (corps) => {
    expect(validerEvenement(corps)).toBeNull();
  });
});

describe('agreger', () => {
  it('compte par jour, type, outil et emplacement et ignore les clés malformées', () => {
    const e = { type: 'clic_editeur', outil: 'abby', emplacement: 'fiche-abby' } as const;
    const cles = [
      cleEvenement(e, DATE, 'a'),
      cleEvenement(e, DATE, 'b'),
      cleEvenement({ ...e, type: 'quiz_termine', emplacement: 'quiz' }, DATE, 'c'),
      'nimporte/quoi',
      '2026-10-23/visite/abby/quiz/d',
    ];
    expect(agreger(cles)).toEqual([
      { jour: '2026-10-23', ...e, n: 2 },
      { jour: '2026-10-23', type: 'quiz_termine', outil: 'abby', emplacement: 'quiz', n: 1 },
    ]);
  });
});

describe('traiterMesure : écriture', () => {
  it('enregistre un événement valide sans autre donnée que la clé', async () => {
    const { magasin, ecrites } = fauxMagasin();
    const r = await traiterMesure(post(OK), deps(magasin));
    expect(r.status).toBe(204);
    expect(ecrites).toEqual(['2026-10-23/clic_editeur/abby/fiche-abby/x1']);
  });

  it('refuse une autre origine, un corps invalide ou trop long', async () => {
    const { magasin, ecrites } = fauxMagasin();
    const d = deps(magasin);
    expect((await traiterMesure(post(OK, { origin: 'https://autre.example' }), d)).status).toBe(
      403,
    );
    expect((await traiterMesure(post('{pas du json'), d)).status).toBe(400);
    expect((await traiterMesure(post(JSON.stringify({ type: 'x' })), d)).status).toBe(400);
    expect((await traiterMesure(post('x'.repeat(1001)), d)).status).toBe(413);
    expect(ecrites).toEqual([]);
  });

  it('refuse les autres méthodes', async () => {
    const { magasin } = fauxMagasin();
    const r = await traiterMesure(
      new Request('https://site.example/api/mesure', { method: 'PUT' }),
      deps(magasin),
    );
    expect(r.status).toBe(405);
  });
});

describe('traiterMesure : lecture', () => {
  const get = (auth?: string, query = '') =>
    new Request(`https://site.example/api/mesure${query}`, {
      headers: auth ? { authorization: auth } : {},
    });
  const cles = [
    '2026-10-23/quiz_termine/abby/quiz/a',
    '2026-10-22/clic_editeur/abby/quiz-abby/b',
    '2026-09-01/clic_editeur/abby/quiz-abby/c',
  ];

  it('exige un jeton à portée fine accepté', async () => {
    const { magasin } = fauxMagasin(cles);
    expect((await traiterMesure(get(), deps(magasin))).status).toBe(401);
    expect((await traiterMesure(get('Bearer ghp_ancien'), deps(magasin))).status).toBe(401);
    expect((await traiterMesure(get('Bearer github_pat_x', ''), deps(magasin, false))).status).toBe(
      401,
    );
  });

  it('renvoie les totaux de la fenêtre demandée', async () => {
    const { magasin } = fauxMagasin(cles);
    const r = await traiterMesure(get('Bearer github_pat_x', '?jours=7'), deps(magasin));
    expect(r.status).toBe(200);
    const corps = (await r.json()) as { jours: number; totaux: { jour: string }[] };
    expect(corps.jours).toBe(7);
    expect(corps.totaux.map((t) => t.jour)).toEqual(['2026-10-23', '2026-10-22']);
  });

  it('borne la fenêtre à 90 jours', async () => {
    const { magasin } = fauxMagasin(cles);
    const r = await traiterMesure(get('Bearer github_pat_x', '?jours=9999'), deps(magasin));
    expect(((await r.json()) as { jours: number }).jours).toBe(90);
  });
});

describe('verificateurGitHub', () => {
  const f = (statut: number, corps: unknown) =>
    (async () => new Response(JSON.stringify(corps), { status: statut })) as typeof fetch;

  it('accepte seulement un jeton avec droit d’écriture', async () => {
    expect(await verificateurGitHub('o/d', f(200, { permissions: { push: true } }))('t')).toBe(
      true,
    );
    expect(await verificateurGitHub('o/d', f(200, { permissions: { push: false } }))('t')).toBe(
      false,
    );
    expect(await verificateurGitHub('o/d', f(401, {}))('t')).toBe(false);
  });
});
