import { expect, test } from '@playwright/test';

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
      // Hydratation comprise : un îlot client:visible hors écran peut ne jamais s'hydrater,
      // on attend donc le calme réseau plutôt que la disparition de tous les attributs ssr.
      await page.goto(chemin, { waitUntil: 'networkidle' });
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
