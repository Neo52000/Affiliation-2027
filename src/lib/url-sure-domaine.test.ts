import { describe, expect, it, vi } from 'vitest';

// Domaine définitif branché (SITE_URL) : ses variantes www. et FQDN restent « le site ».
vi.mock('../config.ts', () => ({ SITE: { url: 'https://efactureguide.fr' } }));

const { estUrlSure } = await import('./url-sure');

describe('estUrlSure avec le domaine définitif', () => {
  it.each([
    'https://efactureguide.fr/go/abby',
    'https://www.efactureguide.fr/go/abby',
    'https://efactureguide.fr./go/abby',
    'https://www.efactureguide.fr./go/abby',
  ])('refuse %s (boucle de redirection)', (u) => {
    expect(estUrlSure(u)).toBe(false);
  });

  it('accepte toujours un autre domaine', () => {
    expect(estUrlSure('https://www.abby.fr/')).toBe(true);
  });
});
