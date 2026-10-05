import { expect, test, type Page } from '@playwright/test';

/** Attend la fin de l'hydratation des îlots (l'attribut ssr disparaît). */
async function attendreHydratation(page: Page) {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

test('1. accueil → page métier plombier', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^Plombier/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/plombier/i);
  await expect(page.getByText("L'essentiel en 3 lignes")).toBeVisible();
});

test('2. quiz : 5 réponses → 1 recommandation + 2 alternatives', async ({ page }) => {
  await page.goto('/outils/quiz');
  await attendreHydratation(page);
  await page.getByLabel('1. Votre métier').fill('Plombier');
  await page.getByLabel('2. Votre statut').selectOption('micro');
  await page.getByLabel('3. Factures émises par mois').selectOption('10-50');
  await page
    .getByRole('group', { name: /compte professionnel/ })
    .getByLabel('Non')
    .check();
  await page
    .getByRole('group', { name: /expert-comptable/ })
    .getByLabel('Non')
    .check();
  await page.getByRole('button', { name: 'Voir ma recommandation' }).click();
  await expect(page.getByRole('heading', { name: 'Notre recommandation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Deux alternatives' })).toBeVisible();
});

test('3. simulateur : TPE assujettie → échéances et check-list', async ({ page }) => {
  await page.goto('/outils/echeance');
  await attendreHydratation(page);
  await page.getByLabel('Taille de votre entreprise').selectOption('pme-tpe-micro');
  await page.getByLabel('Votre situation TVA').selectOption('assujetti');
  await page.getByRole('button', { name: 'Voir mes échéances' }).click();
  await expect(page.getByRole('heading', { name: 'Vos échéances', exact: true })).toBeVisible();
  await expect(page.getByText('Émettre vos factures en électronique :')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Votre check-list' })).toBeVisible();
});

test('4. comparatif tiime-vs-qonto : tableau et verdicts', async ({ page }) => {
  await page.goto('/comparatif/tiime-vs-qonto');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tiime ou Qonto');
  await expect(page.getByRole('heading', { name: 'Verdict par profil' })).toBeVisible();
  await expect(page.getByText('Plateforme agréée (registre DGFiP)')).toBeVisible();
});

test('5. vérificateur de facture : mentions manquantes listées avec leur source', async ({
  page,
}) => {
  await page.goto('/outils/verificateur-facture');
  await attendreHydratation(page);
  await page.getByRole('button', { name: 'Vérifier ma facture' }).click();
  await expect(
    page.getByRole('heading', { name: /mention\(s\) obligatoire\(s\) manquante/ }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Source officielle' }).first()).toBeVisible();
});

test('6. fiche outil : note « Test en cours » et sources datées', async ({ page }) => {
  await page.goto('/logiciels/tiime');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tiime');
  await expect(page.getByText('Test en cours').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
});
