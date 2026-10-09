import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Netlify lit `config` (path, method, schedule, rateLimit) par analyse statique
 * du source, et seulement si `export const config` reçoit directement un objet
 * littéral. Avec `{ … } satisfies Config` (ou `as Config`), la configuration
 * est ignorée sans erreur : la fonction perd sa route, sa planification et sa
 * limite de débit (constaté avec @netlify/zip-it-and-ship-it 16.3.0).
 */
const DOSSIER = fileURLToPath(new URL('../../netlify/functions', import.meta.url));
const fonctions = readdirSync(DOSSIER).filter((f) => /\.m?[jt]s$/.test(f));

describe('netlify/functions', () => {
  it.each(fonctions)('%s : config en objet littéral, lisible par Netlify', (fichier) => {
    const source = readFileSync(join(DOSSIER, fichier), 'utf8');
    if (!/export const config\b/.test(source)) return;
    expect(source).toMatch(/^export const config: Config = \{$/m);
    expect(source).not.toMatch(/\bsatisfies\s+Config\b|\bas\s+Config\b/);
  });

  it('routes, méthode, planification et limites attendues', async () => {
    const admin = await import('../../netlify/functions/admin-github.mts');
    expect(admin.config).toMatchObject({
      path: '/admin/gh/*',
      rateLimit: { windowSize: 60, windowLimit: 120 },
    });
    const newsletter = await import('../../netlify/functions/newsletter.mts');
    expect(newsletter.config).toMatchObject({
      path: '/api/newsletter',
      method: 'POST',
      rateLimit: { windowSize: 60, windowLimit: 5 },
    });
    const reconstruction = await import('../../netlify/functions/reconstruction-quotidienne.mts');
    expect(reconstruction.config).toEqual({ schedule: '5 22,23 * * *' });
  });
});
