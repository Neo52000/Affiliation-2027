import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

// Un lien affilié actif, pour vérifier la branche « sponsorisée » sans
// toucher au fichier réel (tous les liens y sont null aujourd'hui).
vi.mock('../data/affiliation.json', () => ({
  default: {
    date_maj: '2026-10-23',
    liens: {
      abby: {
        url: 'https://partenaire.example/abby?ref=efg',
        reseau: 'direct',
        actif: true,
        maj: '2026-10-23',
      },
    },
  },
}));

const { affiliateLink, MENTION_AFFILIEE } = await import('./affiliate');

describe('lien affilié actif', () => {
  it('passe par /go/, porte rel sponsored et la mention visible', () => {
    expect(affiliateLink('abby', 'https://abby.fr/')).toEqual({
      href: '/go/abby',
      sponsored: true,
      rel: 'sponsored nofollow noopener',
      mention: MENTION_AFFILIEE,
    });
  });
});

describe('boutons d’outil', () => {
  // Garde-fou : rel et mention viennent tous de affiliateLink(), jamais d'un
  // littéral recopié dans un composant (règle d'étiquetage, section 8).
  it.each(['../components/AffiliateButton.astro', '../components/islands/Quiz.tsx'])(
    '%s n’écrit ni rel « sponsored » ni « lien affilié » en dur',
    (chemin) => {
      const source = readFileSync(new URL(chemin, import.meta.url), 'utf8');
      expect(source).toContain('rel={lien.rel}');
      expect(source).toContain('{lien.mention}');
      expect(source).not.toMatch(/['"]sponsored/);
      expect(source).not.toMatch(/>\s*lien affilié\s*</);
    },
  );
});
