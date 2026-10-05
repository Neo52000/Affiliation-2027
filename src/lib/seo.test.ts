import { describe, expect, it } from 'vitest';
import { canonicalUrl, pageTitle, validateMeta, TITLE_MAX } from './seo';

describe('pageTitle', () => {
  it('compose « Page | Site » quand la longueur le permet', () => {
    expect(pageTitle('Quiz', 'MonSite')).toBe('Quiz | MonSite');
  });

  it('retombe sur le titre de page seul quand le composé dépasse la limite', () => {
    const page = 'Facturation électronique pour infirmier libéral';
    const composed = pageTitle(page, 'Un nom de site vraiment long');
    expect(composed).toBe(page);
    expect(composed.length).toBeLessThan(TITLE_MAX);
  });
});

describe('validateMeta', () => {
  it('accepte un couple conforme', () => {
    expect(validateMeta('Titre court', 'Description correcte.')).toEqual([]);
  });

  it('rejette un title de 60 caractères ou plus', () => {
    expect(validateMeta('x'.repeat(60), 'ok')).toHaveLength(1);
    expect(validateMeta('x'.repeat(59), 'ok')).toEqual([]);
  });

  it('rejette une description de 155 caractères ou plus', () => {
    expect(validateMeta('ok', 'x'.repeat(155))).toHaveLength(1);
    expect(validateMeta('ok', 'x'.repeat(154))).toEqual([]);
  });

  it('rejette title et description vides', () => {
    expect(validateMeta('', '  ')).toHaveLength(2);
  });
});

describe('canonicalUrl', () => {
  const site = 'https://exemple.fr';

  it('racine avec slash final', () => {
    expect(canonicalUrl(site, '/')).toBe('https://exemple.fr/');
  });

  it('page sans slash final', () => {
    expect(canonicalUrl(site, '/logiciels/tiime/')).toBe('https://exemple.fr/logiciels/tiime');
  });

  it('ignore la query string et normalise le slash du site', () => {
    expect(canonicalUrl('https://exemple.fr/', '/outils/quiz?x=1')).toBe(
      'https://exemple.fr/outils/quiz',
    );
  });
});
