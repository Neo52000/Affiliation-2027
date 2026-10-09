import { readFileSync } from 'node:fs';
import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * Back office /admin de bout en bout, relais GitHub (/admin/gh/*) simulé :
 * connexion, contrôles du jeton et de la branche principale, édition d'un lien
 * affilié, demande de publication, vérifications, mise en ligne.
 */
const DEPOT = '/admin/gh/repos/Neo52000/Affiliation-2027';
const JETON = `github_pat_${'A'.repeat(40)}`;
const b64 = (texte: string) => Buffer.from(texte, 'utf8').toString('base64');

interface Appel {
  methode: string;
  chemin: string;
  corps: unknown;
  auth: string | undefined;
}

interface Options {
  push?: boolean;
  regles?: string[];
  /** Statut renvoyé par la création de la pull request (201 par défaut). */
  creationPr?: number;
  /** La demande est fusionnée sur GitHub, hors du back office, après sa première lecture. */
  fusionExterne?: boolean;
}

async function simulerGitHub(page: Page, options: Options = {}) {
  const appels: Appel[] = [];
  let fusionnee = false;
  let branche = '';
  let lecturesPr = 0;
  const repondre = (route: Route, statut: number, corps: unknown, entetes = {}) =>
    route.fulfill({
      status: statut,
      contentType: 'application/json',
      headers: entetes,
      body: statut === 204 ? '' : JSON.stringify(corps),
    });
  const regles = options.regles ?? [
    'deletion',
    'non_fast_forward',
    'pull_request',
    'required_status_checks',
  ];

  await page.route('**/admin/gh/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const chemin = url.pathname.replace(DEPOT, '') + url.search;
    const methode = req.method();
    appels.push({
      methode,
      chemin,
      corps: req.postData() ? JSON.parse(req.postData()!) : undefined,
      auth: (await req.headerValue('authorization')) ?? undefined,
    });
    const cle = `${methode} ${chemin}`;
    const contenu = (f: string) => ({
      content: b64(readFileSync(f, 'utf8')),
      encoding: 'base64',
      sha: `sha-${f}`,
    });
    if (cle === 'GET ') {
      return repondre(
        route,
        200,
        { permissions: { push: options.push ?? true } },
        { 'github-authentication-token-expiration': '2026-11-20 10:00:00 UTC' },
      );
    }
    if (cle === 'GET /rules/branches/main') {
      return repondre(
        route,
        200,
        regles.map((type) =>
          type === 'required_status_checks'
            ? { type, parameters: { required_status_checks: [{ context: 'verify' }] } }
            : { type },
        ),
      );
    }
    if (cle === 'GET /contents/src/data/affiliation.json?ref=main') {
      return repondre(route, 200, contenu('src/data/affiliation.json'));
    }
    if (cle === 'GET /contents/src/data/publicites.json?ref=main') {
      return repondre(route, 200, contenu('src/data/publicites.json'));
    }
    if (cle === 'GET /contents/src/assets/publicites?ref=main') {
      return repondre(route, 200, [{ name: 'LISEZMOI.md', type: 'file' }]);
    }
    if (cle === 'GET /pulls?state=open&per_page=30') {
      // Demandes piégées ouvertes par un tiers : le back office doit les ignorer.
      const piege = (numero: number, ref: string, depot: string) => ({
        number: numero,
        html_url: `https://github.com/Neo52000/Affiliation-2027/pull/${numero}`,
        title: 'Piège',
        head: { ref, sha: 'piege', repo: { full_name: depot } },
      });
      return repondre(route, 200, [
        piege(98, 'back-office/%2e%2e/%2e%2e/tags/v1.0', 'Tiers/Affiliation-2027'),
        piege(99, 'back-office/20261009-120000-abcd', 'Tiers/Affiliation-2027'),
      ]);
    }
    if (cle === 'GET /git/ref/heads/main')
      return repondre(route, 200, { object: { sha: 'parent' } });
    if (cle === 'GET /git/commits/parent') return repondre(route, 200, { tree: { sha: 'arbre0' } });
    if (cle === 'POST /git/blobs') return repondre(route, 201, { sha: 'blob1' });
    if (cle === 'POST /git/trees') return repondre(route, 201, { sha: 'arbre1' });
    if (cle === 'POST /git/commits') return repondre(route, 201, { sha: 'c0ffee' });
    if (cle === 'POST /git/refs') {
      branche = (JSON.parse(req.postData()!) as { ref: string }).ref.replace('refs/heads/', '');
      return repondre(route, 201, {});
    }
    if (cle === 'POST /pulls' && options.creationPr && options.creationPr !== 201) {
      return repondre(route, options.creationPr, { message: 'Validation Failed' });
    }
    if (cle === 'POST /pulls') {
      return repondre(route, 201, {
        number: 7,
        html_url: 'https://github.com/Neo52000/Affiliation-2027/pull/7',
        title: 'Back office',
      });
    }
    if (cle === 'GET /pulls/7') {
      if (options.fusionExterne && ++lecturesPr > 1) fusionnee = true;
      return repondre(route, 200, {
        state: fusionnee ? 'closed' : 'open',
        merged: fusionnee,
        mergeable: true,
        mergeable_state: 'clean',
        base: { ref: 'main' },
        head: { ref: branche, sha: 'c0ffee', repo: { full_name: 'Neo52000/Affiliation-2027' } },
      });
    }
    if (cle === 'GET /pulls/7/files?per_page=100') {
      return repondre(route, 200, [{ filename: 'src/data/affiliation.json' }]);
    }
    if (cle === 'GET /actions/runs?head_sha=c0ffee&event=pull_request&per_page=20') {
      return repondre(route, 200, {
        workflow_runs: [
          {
            status: 'completed',
            conclusion: 'success',
            path: '.github/workflows/ci.yml',
            head_branch: branche,
            head_sha: 'c0ffee',
          },
        ],
      });
    }
    if (cle === 'PATCH /pulls/7') {
      return repondre(route, 200, {
        state: 'closed',
        head: { ref: branche, repo: { full_name: 'Neo52000/Affiliation-2027' } },
      });
    }
    if (cle === 'PUT /pulls/7/merge') {
      fusionnee = true;
      return repondre(route, 200, { merged: true });
    }
    if (methode === 'DELETE') return repondre(route, 204, null);
    return repondre(route, 404, { message: `non simulé : ${cle}` });
  });
  return appels;
}

async function seConnecter(page: Page, jeton = JETON) {
  await page.goto('/admin');
  await page.getByLabel('Jeton GitHub').fill(jeton);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

test('page non indexée ; aucun formulaire ni champ de jeton dans le HTML statique', async ({
  page,
  request,
}) => {
  const html = await (await request.get('/admin')).text();
  expect(html).not.toMatch(/<form/i);
  expect(html).not.toMatch(/type="password"/);
  await page.goto('/admin');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const jeton = page.getByLabel('Jeton GitHub');
  await expect(jeton).toHaveAttribute('type', 'password');
  expect(await jeton.getAttribute('name')).toBeNull();
});

test('refuse un jeton classique avant tout appel', async ({ page }) => {
  const appels = await simulerGitHub(page);
  await seConnecter(page, `ghp_${'A'.repeat(36)}`);
  await expect(page.getByText('Jeton à portée fine attendu')).toBeVisible();
  expect(appels).toHaveLength(0);
});

test('jeton sans droit d’écriture : refus explicite, rien n’est chargé', async ({ page }) => {
  await simulerGitHub(page, { push: false });
  await seConnecter(page);
  await expect(page.getByText('Accès refusé')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Données du site' })).toHaveCount(0);
});

test('branche principale non protégée : publication bloquée', async ({ page }) => {
  await simulerGitHub(page, { regles: ['pull_request'] });
  await seConnecter(page);
  await expect(page.getByText('la branche principale n’est pas protégée')).toBeVisible();
  const tiime = page.getByRole('group', { name: 'Tiime' });
  await tiime.getByLabel('URL affiliée').fill('https://www.tiime.fr/?via=partenaire');
  await expect(
    page.getByRole('button', { name: 'Créer la demande de publication' }),
  ).toBeDisabled();
});

test('lien affilié : saisie, publication vérifiée par la CI, mise en ligne', async ({ page }) => {
  const appels = await simulerGitHub(page);
  await seConnecter(page);
  await expect(page.getByRole('heading', { name: 'Données du site' })).toBeFocused();
  await expect(page.getByText('Jeton valable jusqu’au')).toBeVisible();

  const tiime = page.getByRole('group', { name: 'Tiime' });
  const url = tiime.getByLabel('URL affiliée');
  const publier = page.getByRole('button', { name: 'Créer la demande de publication' });

  // URL refusée : erreur liée au champ, publication bloquée.
  await url.fill('http://non-securise.fr/');
  await tiime.getByLabel('Lien actif').check();
  await expect(url).toHaveAttribute('aria-invalid', 'true');
  await expect(publier).toBeDisabled();

  await url.fill('https://www.tiime.fr/?via=partenaire');
  await tiime.getByLabel('Réseau ou programme (publié sur la page transparence)').fill('Affilae');
  await expect(url).not.toHaveAttribute('aria-invalid', 'true');
  await expect(tiime.getByText('Domaine de destination : www.tiime.fr')).toBeVisible();
  await expect(page.getByText('Lien affilié tiime : actif (Affilae)')).toBeVisible();

  await expect(page.getByText(/Demande n° 9[89]/)).toHaveCount(0);
  await publier.click();
  await expect(page.getByText(/^Demande n° 7 :/)).toBeVisible();
  await expect(page.getByText('vérifications réussies')).toBeVisible();

  // Un seul commit : le fichier écrit est du JSON valide portant le lien saisi.
  const blob = appels.find((a) => a.methode === 'POST' && a.chemin === '/git/blobs')!;
  const contenu = Buffer.from((blob.corps as { content: string }).content, 'base64').toString();
  expect(JSON.parse(contenu).liens.tiime).toMatchObject({
    url: 'https://www.tiime.fr/?via=partenaire',
    reseau: 'Affilae',
    actif: true,
  });
  const arbre = appels.find((a) => a.chemin === '/git/trees')!.corps as {
    tree: { path: string }[];
  };
  expect(arbre.tree.map((t) => t.path)).toEqual(['src/data/affiliation.json']);
  expect(appels.every((a) => a.auth === `Bearer ${JETON}`)).toBe(true);
  expect(appels.filter((a) => a.chemin.includes('/pulls/9'))).toHaveLength(0);

  await page.getByRole('button', { name: 'Mettre en ligne' }).click();
  await expect(page.getByText('mise en ligne : Netlify déploie le site')).toBeAttached();
  const fusion = appels.find((a) => a.chemin === '/pulls/7/merge')!;
  expect(fusion.corps).toEqual({ sha: 'c0ffee', merge_method: 'squash' });
});

test('se déconnecter efface la session', async ({ page }) => {
  await simulerGitHub(page);
  await seConnecter(page);
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByLabel('Jeton GitHub')).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Données du site' })).toHaveCount(0);
});

test('abandon : la demande est fermée, le brouillon est conservé pour être corrigé', async ({
  page,
}) => {
  const appels = await simulerGitHub(page);
  await seConnecter(page);
  const url = page.getByRole('group', { name: 'Tiime' }).getByLabel('URL affiliée');
  await url.fill('https://www.tiime.fr/?via=partenaire');
  await page.getByRole('button', { name: 'Créer la demande de publication' }).click();
  await expect(page.getByText(/^Demande n° 7 :/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Publication' })).toBeFocused();

  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Abandonner la demande n° 7' }).click();
  await expect(page.getByText(/^Demande n° 7 :/)).toHaveCount(0);
  await expect(url).toHaveValue('https://www.tiime.fr/?via=partenaire');
  await expect(url).toBeEnabled();
  expect(appels.find((a) => a.methode === 'PATCH')!.corps).toEqual({ state: 'closed' });
  expect(appels.filter((a) => a.methode === 'DELETE').map((a) => a.chemin)).toEqual([
    expect.stringMatching(/^\/git\/refs\/heads\/back-office\/\d{8}-\d{6}-[0-9a-f]{4}$/),
  ]);
});

test('échec de publication : message visible et annoncé, sans perte du brouillon', async ({
  page,
}) => {
  await simulerGitHub(page, { creationPr: 422 });
  await seConnecter(page);
  const url = page.getByRole('group', { name: 'Tiime' }).getByLabel('URL affiliée');
  await url.fill('https://www.tiime.fr/?via=partenaire');
  await page.getByRole('button', { name: 'Créer la demande de publication' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Erreur GitHub 422' })).toBeVisible();
  await expect(url).toHaveValue('https://www.tiime.fr/?via=partenaire');
});

test('jeton refusé : l’erreur est annoncée (role=alert)', async ({ page }) => {
  await page.route('**/admin/gh/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"message":"Bad credentials"}',
    }),
  );
  await seConnecter(page);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Jeton refusé par GitHub' }),
  ).toBeVisible();
});

test('inactivité : préavis visible et atteignable, « Rester connecté » rend le focus', async ({
  page,
}) => {
  await page.clock.install();
  await simulerGitHub(page);
  await seConnecter(page);
  const url = page.getByRole('group', { name: 'Tiime' }).getByLabel('URL affiliée');
  await url.fill('https://www.tiime.fr/?via=partenaire');

  await page.clock.runFor('28:01');
  const preavis = page.getByRole('alert').filter({ hasText: 'session sera fermée' });
  await expect(preavis).toBeInViewport();
  const rester = preavis.getByRole('button', { name: 'Rester connecté' });
  await expect(rester).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(preavis).toHaveCount(0);
  await expect(url).toBeFocused();
  await expect(url).toHaveValue('https://www.tiime.fr/?via=partenaire');

  // Prolongée : toujours connecté 28 minutes plus tard (nouveau préavis), pas avant.
  await page.clock.runFor('27:00');
  await expect(page.getByRole('heading', { name: 'Données du site' })).toBeVisible();
  await expect(preavis).toHaveCount(0);
});

test('demande fusionnée sur GitHub : l’écran se libère, aucune seconde fusion', async ({
  page,
}) => {
  const appels = await simulerGitHub(page, { fusionExterne: true });
  await seConnecter(page);
  await page
    .getByRole('group', { name: 'Tiime' })
    .getByLabel('URL affiliée')
    .fill('https://www.tiime.fr/?via=partenaire');
  await page.getByRole('button', { name: 'Créer la demande de publication' }).click();
  await expect(page.getByText('vérifications réussies')).toBeVisible();

  await page.getByRole('button', { name: 'Mettre en ligne la demande n° 7' }).click();
  await expect(page.getByText(/^Demande n° 7 :/)).toHaveCount(0);
  await expect(page.getByText('Demande déjà mise en ligne')).toBeAttached();
  await expect(page.getByText('Mise en ligne refusée')).toHaveCount(0);
  expect(appels.some((a) => a.methode === 'PUT')).toBe(false);
});
