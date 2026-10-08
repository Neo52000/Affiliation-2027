import { expect, test, type Page } from '@playwright/test';

/** Animations infinies en cours : téléscripteur, halo, pastille, illustration. */
const boucles = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (a) => a.effect?.getComputedTiming().iterations === Infinity && a.playState === 'running',
        ).length,
  );

test.describe('mouvement', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('le bouton pause arrête les boucles et le choix survit au rechargement', async ({
    page,
  }) => {
    await page.goto('/');
    await expect.poll(() => boucles(page)).toBeGreaterThan(0);

    const bouton = page.getByRole('button', { name: 'Mettre les animations en pause' });
    await bouton.click();
    await expect(bouton).toHaveAttribute('aria-pressed', 'true');
    expect(await boucles(page)).toBe(0);

    await page.reload();
    await expect(bouton).toHaveAttribute('aria-pressed', 'true');
    expect(await boucles(page)).toBe(0);

    await bouton.click();
    await expect(bouton).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => boucles(page)).toBeGreaterThan(0);
  });

  test('les compteurs finissent sur la valeur lue par les lecteurs d’écran', async ({ page }) => {
    await page.goto('/');
    const tuiles = page.locator('.stat-tile');
    await expect(tuiles).toHaveCount(3);
    for (const tuile of await tuiles.all()) {
      const lue = await tuile.locator('.sr-only').textContent();
      await expect(tuile.locator('[data-compteur]')).toHaveText(lue ?? '');
    }
  });
});

test.describe('mouvement réduit', () => {
  test.use({ reducedMotion: 'reduce' });

  test('aucune boucle et pas de bouton pause', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.btn-pause')).toBeHidden();
    expect(await boucles(page)).toBe(0);
  });
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
