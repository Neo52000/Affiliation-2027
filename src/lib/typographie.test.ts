import { describe, expect, it } from 'vitest';
import { de, pluriel } from './typographie';

describe('de', () => {
  it('élide devant une voyelle, pas devant une consonne', () => {
    expect(de('Abby')).toBe('d’Abby');
    expect(de('Indy')).toBe('d’Indy');
    expect(de('Tiime')).toBe('de Tiime');
    expect(de('Épicerie fine')).toBe('d’Épicerie fine');
  });
});

describe('pluriel', () => {
  it('accorde le groupe nominal au-delà de 1', () => {
    expect(pluriel(1, 'mention obligatoire manquante')).toBe('1 mention obligatoire manquante');
    expect(pluriel(0, 'mention obligatoire manquante')).toBe('0 mention obligatoire manquante');
    expect(pluriel(3, 'mention obligatoire manquante')).toBe('3 mentions obligatoires manquantes');
    expect(pluriel(2, 'prix relevé')).toBe('2 prix relevés');
  });
});
