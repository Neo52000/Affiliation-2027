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

test.describe('téléscripteur', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1366, height: 900 } });

  /** Cale la boucle à `ms` et renvoie le centre d'un lien entièrement visible du bandeau. */
  const lienVisible = (page: Page, ms: number) =>
    page.evaluate((t) => {
      const piste = document.querySelector<HTMLElement>('.m-defile-piste');
      const anim = piste?.getAnimations()[0];
      if (!anim) return null;
      anim.currentTime = t;
      anim.pause();
      const cadre = document.querySelector('.m-defile')!.getBoundingClientRect();
      const liens = [...document.querySelectorAll<HTMLAnchorElement>('.m-defile a')];
      const groupe2 = liens.slice(liens.length / 2);
      const vu = groupe2.find((a) => {
        const r = a.getBoundingClientRect();
        return r.left > cadre.left + 40 && r.right < cadre.right - 40;
      });
      if (!vu) return null;
      const r = vu.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, href: vu.getAttribute('href') };
    }, ms);

  test('un clic en milieu de boucle, même sur le doublon, ouvre le hub visé', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => boucles(page)).toBeGreaterThan(0);
    const cible = await lienVisible(page, 30_000);
    expect(cible).not.toBeNull();
    await page.mouse.click(cible!.x, cible!.y, { delay: 120 });
    await expect(page).toHaveURL(new RegExp(`${cible!.href}$`));
  });

  test('au clavier, le lien focalisé reste entier dans le bandeau', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => boucles(page)).toBeGreaterThan(0);
    const lien = page.locator('.m-defile-groupe').first().getByRole('link', { name: 'Transport' });
    await lien.focus();
    const [cadre, boite] = await Promise.all([
      page.locator('.m-defile').boundingBox(),
      lien.boundingBox(),
    ]);
    expect(boite!.x).toBeGreaterThanOrEqual(cadre!.x);
    expect(boite!.x + boite!.width).toBeLessThanOrEqual(cadre!.x + cadre!.width);
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
