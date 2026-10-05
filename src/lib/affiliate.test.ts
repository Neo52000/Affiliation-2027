import { describe, expect, it } from 'vitest';
import { affiliateLink, hasAffiliate } from './affiliate';

// affiliation.json ne contient que des liens null tant que LIENS_AFFILIES
// n'est pas renseigné (TODO.md #6) : la bascule « URL officielle sans mention »
// est donc le comportement attendu aujourd'hui.
describe('affiliateLink', () => {
  it('bascule vers l’URL officielle sans mention quand le lien affilié est absent', () => {
    const l = affiliateLink('tiime', 'https://www.tiime.fr/');
    expect(l).toEqual({ href: 'https://www.tiime.fr/', sponsored: false });
  });

  it('bascule aussi pour un slug inconnu du fichier d’affiliation', () => {
    const l = affiliateLink('outil-inconnu', 'https://exemple.fr/');
    expect(l).toEqual({ href: 'https://exemple.fr/', sponsored: false });
  });
});

describe('hasAffiliate', () => {
  it('aucun bandeau de transparence tant que tous les liens sont null', () => {
    expect(hasAffiliate(['tiime', 'qonto', 'pennylane', 'abby', 'indy', 'shine'])).toBe(false);
  });
});
