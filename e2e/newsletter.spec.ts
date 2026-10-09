import { expect, test } from '@playwright/test';

// Tant que l'éditeur n'est pas identifié (src/config.ts, mentions légales), aucune
// adresse n'est collectée : formulaires absents, annonce explicite sur les pages dédiées.
test('newsletter et rappel fermés tant que l’éditeur n’est pas identifié', async ({ page }) => {
  await page.goto('/newsletter');
  await expect(page.getByText('ne sont pas encore ouvertes')).toBeVisible();
  await expect(page.locator('form[action="/api/newsletter"]')).toHaveCount(0);

  await page.goto('/');
  await expect(page.locator('form[action="/api/newsletter"]')).toHaveCount(0);

  await page.goto('/outils/echeance');
  await expect(page.getByText(/Le rappel par email n.est pas encore ouvert/)).toBeVisible();
  await expect(page.getByLabel('Votre email')).toHaveCount(0);
});

test('sitemap : pages d’état et back office exclus, page newsletter incluse', async ({
  request,
}) => {
  const index = await (await request.get('/sitemap-0.xml')).text();
  expect(index).toContain('/newsletter</loc>');
  expect(index).not.toContain('/newsletter/');
  expect(index).not.toContain('/admin');
});
