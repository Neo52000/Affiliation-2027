import { describe, expect, it } from 'vitest';
import { newsletterOuverte, rappelOuvert } from './collecte';

const BREVO = {
  EMAIL_API_KEY: 'cle',
  NEWSLETTER_DOI_TEMPLATE_ID: '1',
  NEWSLETTER_LISTE_ID: '2',
  EMAIL_DOI_TEMPLATE_ID: '3',
  EMAIL_LISTE_ID: '4',
};

describe('ouverture des formulaires email', () => {
  it('fermés sans prestataire configuré, même éditeur identifié', () => {
    expect(newsletterOuverte({}, true)).toBe(false);
    expect(rappelOuvert({}, true)).toBe(false);
    expect(newsletterOuverte({ ...BREVO, NEWSLETTER_LISTE_ID: ' ' }, true)).toBe(false);
    expect(rappelOuvert({ ...BREVO, EMAIL_LISTE_ID: undefined }, true)).toBe(false);
  });

  it('fermés tant que l’éditeur n’est pas identifié, même prestataire configuré', () => {
    expect(newsletterOuverte(BREVO, false)).toBe(false);
    expect(rappelOuvert(BREVO, false)).toBe(false);
  });

  it('ouverts avec éditeur identifié et variables présentes, chaque liste indépendamment', () => {
    expect(newsletterOuverte(BREVO, true)).toBe(true);
    expect(rappelOuvert(BREVO, true)).toBe(true);
    const newsletterSeule = { ...BREVO, EMAIL_LISTE_ID: undefined };
    expect(newsletterOuverte(newsletterSeule, true)).toBe(true);
    expect(rappelOuvert(newsletterSeule, true)).toBe(false);
  });
});
