import { expect, test, type Page } from '@playwright/test';

/**
 * Le design ne s'anime pas : ni boucle, ni animation d'entrée. Seules les
 * transitions de couleur au survol restent (120 ms), qui ne jouent pas au
 * chargement.
 */
test.describe('aucune animation au chargement', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const chemin of [
    '/',
    '/metiers/batiment',
    '/facturation-electronique/plombier',
    '/logiciels/tiime',
    '/outils/quiz',
  ]) {
    test(chemin, async ({ page }) => {
      // Une animation courte et terminée disparaît de getAnimations() : on écoute
      // donc aussi leur démarrage dès le premier octet, pseudo-éléments compris.
      await page.addInitScript(() => {
        const vus: string[] = [];
        Object.defineProperty(window, '__mouvements', { value: vus });
        addEventListener('animationstart', (e) => vus.push(`animation ${e.animationName}`), true);
        addEventListener('transitionrun', (e) => vus.push(`transition ${e.propertyName}`), true);
      });
      // Hydratation comprise : un îlot client:visible hors écran peut ne jamais s'hydrater,
      // on attend donc le calme réseau plutôt que la disparition de tous les attributs ssr.
      await page.goto(chemin, { waitUntil: 'networkidle' });
      expect(
        await page.evaluate(() => (window as unknown as { __mouvements: string[] }).__mouvements),
      ).toEqual([]);
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    });
  }
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('le sélecteur de métier reste masqué, la liste des métiers reste lisible', async ({
    page,
  }) => {
    await page.goto('/metiers/batiment');
    await expect(page.locator('.selecteur-metier')).toBeHidden();
    await expect(
      page
        .getByRole('region', { name: 'Choisir votre métier' })
        .getByRole('link', { name: /plombier/i }),
    ).toBeVisible();
  });
});

test('hub : un choix fait avant l’hydratation est repris par le sélecteur', async ({ page }) => {
  await page.route('**/MetierPicker*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto('/metiers/batiment');
  await page.getByRole('radio', { name: 'Plombier' }).check();
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
  await expect(page.getByRole('status')).toContainText('Plombier :');
});

test('quiz prérempli depuis ?metier=, slug inconnu ignoré', async ({ page }) => {
  await page.goto('/outils/quiz?metier=plombier');
  await expect(page.getByLabel('1. Votre métier')).toHaveValue('Plombier');
  await page.getByRole('button', { name: 'Voir ma recommandation' }).click();
  await expect(page.getByRole('heading', { name: 'Notre recommandation' })).toBeFocused();

  await page.goto('/outils/quiz?metier=inconnu');
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
  await expect(page.getByLabel('1. Votre métier')).toHaveValue('');
});

test('hub : le sélecteur annonce la recommandation de la fiche choisie', async ({ page }) => {
  await page.goto('/metiers/batiment');
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
  await page.getByRole('radio', { name: 'Plombier' }).check();
  await expect(page.getByRole('status')).toContainText('Plombier :');
  await expect(page.getByRole('link', { name: 'Affiner en 5 questions' })).toHaveAttribute(
    'href',
    '/outils/quiz?metier=plombier',
  );
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Plombier' })).not.toBeChecked();
});

/**
 * Le postbuild pose les espaces insécables dans le HTML ; les îlots doivent
 * produire le même texte, sinon l'hydratation remet des espaces ordinaires
 * (check-redaction ne lit que le HTML construit).
 */
test.describe('espaces insécables conservés après hydratation', () => {
  const espaceFautive = / [:;?!»]|« /;
  const hydrater = async (page: Page, chemin: string) => {
    await page.goto(chemin);
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
  };
  const texteDesIlots = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('astro-island')].map((i) => i.textContent ?? '').join('\n'),
    );

  test('quiz, sans métier puis avec', async ({ page }) => {
    await hydrater(page, '/outils/quiz');
    await page.getByRole('button', { name: 'Voir ma recommandation' }).click();
    expect(await texteDesIlots(page)).not.toMatch(espaceFautive);
    await hydrater(page, '/outils/quiz?metier=plombier');
    await page.getByRole('button', { name: 'Voir ma recommandation' }).click();
    expect(await texteDesIlots(page)).not.toMatch(espaceFautive);
  });

  test('vérificateur, mentions manquantes', async ({ page }) => {
    await hydrater(page, '/outils/verificateur-facture');
    await page.getByRole('button', { name: 'Vérifier ma facture' }).click();
    expect(await texteDesIlots(page)).not.toMatch(espaceFautive);
  });

  test('simulateur, franchise en base et non assujetti', async ({ page }) => {
    await hydrater(page, '/outils/echeance');
    for (const tva of ['franchise', 'non-assujetti']) {
      await page.selectOption('#sim-tva', tva);
      await page.getByRole('button', { name: 'Voir mes échéances' }).click();
      expect(await texteDesIlots(page)).not.toMatch(espaceFautive);
    }
  });

  test('sélecteur de métier d’une famille', async ({ page }) => {
    await hydrater(page, '/metiers/batiment');
    expect(await texteDesIlots(page)).not.toMatch(espaceFautive);
    await page.getByRole('radio', { name: 'Plombier' }).check();
    expect(await texteDesIlots(page)).not.toMatch(espaceFautive);
  });
});
