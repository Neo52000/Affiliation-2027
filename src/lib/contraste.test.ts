import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Garde de contraste (WCAG 2.2 AA) sur les jetons de couleur de global.css, en
 * clair et en sombre : un jeton modifié qui ferait passer un texte sous 4,5:1
 * ou un bord de contrôle sous 3:1 fait échouer `pnpm test`.
 */
const css = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');

function bloc(debut: string): string {
  const i = css.indexOf(debut);
  if (i < 0) throw new Error(`global.css : bloc « ${debut} » introuvable`);
  return css.slice(i, css.indexOf('}', i));
}

function jetons(texte: string): Record<string, string> {
  return Object.fromEntries(
    [...texte.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [
      m[1]!,
      m[2]!.toLowerCase(),
    ]),
  );
}

const clair = jetons(bloc('@theme {'));
const sombre = { ...clair, ...jetons(bloc('@media (prefers-color-scheme: dark)')) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (haut + 0.05) / (bas + 0.05);
}

/** [premier plan, fond, ratio minimal] : 4,5 pour du texte, 3 pour un bord de contrôle. */
const PAIRES: [string, string, number][] = [
  ['ink', 'paper', 4.5],
  ['ink', 'paper-soft', 4.5],
  ['ink', 'field', 4.5],
  ['ink', 'accent-soft', 4.5],
  ['ink-soft', 'paper', 4.5],
  ['ink-soft', 'paper-soft', 4.5],
  ['ink-soft', 'field', 4.5],
  ['accent', 'paper', 4.5],
  ['accent', 'paper-soft', 4.5],
  ['accent', 'field', 4.5],
  ['accent', 'accent-soft', 4.5],
  ['on-accent', 'accent', 4.5],
  ['on-accent', 'accent-strong', 4.5],
  ['ok', 'paper', 4.5],
  ['erreur', 'paper', 4.5],
  ['erreur', 'field', 4.5],
  ['border-strong', 'paper', 3],
  ['border-strong', 'paper-soft', 3],
  ['border-strong', 'field', 3],
];

describe.each([
  ['clair', clair],
  ['sombre', sombre],
])('contrastes du thème %s', (_, theme) => {
  it.each(PAIRES)('%s sur %s ≥ %s:1', (avant, fond, minimum) => {
    const a = theme[avant];
    const b = theme[fond];
    expect(a, `jeton --color-${avant} absent`).toBeDefined();
    expect(b, `jeton --color-${fond} absent`).toBeDefined();
    expect(contraste(a!, b!)).toBeGreaterThanOrEqual(minimum);
  });
});

it('le thème sombre redéfinit chaque couleur de fond et de texte', () => {
  const dansSombre = jetons(bloc('@media (prefers-color-scheme: dark)'));
  for (const nom of ['ink', 'ink-soft', 'paper', 'paper-soft', 'field', 'accent', 'on-accent']) {
    expect(dansSombre[nom], `--color-${nom} absent du thème sombre`).toBeDefined();
  }
});
