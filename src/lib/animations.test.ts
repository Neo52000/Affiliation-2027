import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLE_ANIMATIONS, VALEUR_PAUSE, basculer, classeHtml, etatInitial } from './animations';

describe('préférence des animations', () => {
  it('démarre actives sauf pause mémorisée', () => {
    expect(etatInitial(null)).toBe('on');
    expect(etatInitial('n’importe quoi')).toBe('on');
    expect(etatInitial(VALEUR_PAUSE)).toBe('pause');
  });

  it('bascule dans les deux sens et nomme la classe de <html>', () => {
    expect(basculer('on')).toBe('pause');
    expect(basculer('pause')).toBe('on');
    expect(classeHtml('on')).toBe('anim-on');
    expect(classeHtml('pause')).toBe('anim-pause');
  });

  it('le script de tête de Base.astro lit la même clé et la même valeur', () => {
    const base = readFileSync(
      fileURLToPath(new URL('../layouts/Base.astro', import.meta.url)),
      'utf8',
    );
    expect(base).toContain('CLE_ANIMATIONS');
    expect(base).toContain('VALEUR_PAUSE');
    expect(CLE_ANIMATIONS).toBe('animations');
  });
});
