import { describe, expect, it } from 'vitest';
import { formatDateFr } from './dates';
import { metierDescription, metierTitle, TITLE_MAX, DESCRIPTION_MAX } from './seo';

describe('formatDateFr', () => {
  it('formate les dates clés de la réforme', () => {
    expect(formatDateFr('2026-09-01')).toBe('1er septembre 2026');
    expect(formatDateFr('2027-09-01')).toBe('1er septembre 2027');
  });

  it('gère les jours autres que le 1er', () => {
    expect(formatDateFr('2026-12-18')).toBe('18 décembre 2026');
  });

  it('rejette une date invalide', () => {
    expect(() => formatDateFr('2026-13-01')).toThrow();
    expect(() => formatDateFr('n/a')).toThrow();
  });
});

describe('metierTitle / metierDescription', () => {
  const noms = [
    'plombier',
    'infirmier libéral',
    'développeur freelance',
    'conseiller en gestion de patrimoine',
    'transport de personnes à mobilité réduite',
  ];

  it('reste sous les longueurs imposées pour les noms courts et longs', () => {
    for (const nom of noms) {
      expect(metierTitle(nom).length).toBeLessThan(TITLE_MAX);
      expect(metierDescription(nom).length).toBeLessThan(DESCRIPTION_MAX);
    }
  });

  it('contient toujours le nom du métier (unicité entre pages)', () => {
    for (const nom of ['plombier', 'infirmier libéral']) {
      expect(metierTitle(nom)).toContain(nom);
      expect(metierDescription(nom)).toContain(nom);
    }
  });
});
