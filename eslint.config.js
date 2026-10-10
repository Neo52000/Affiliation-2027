// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  {
    ignores: ['dist/', '.astro/', 'node_modules/', '.netlify/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],
  {
    // Un tableau large défile dans une région nommée : elle doit recevoir le focus
    // pour défiler au clavier (WCAG 2.1.1, règle axe scrollable-region-focusable).
    files: ['**/*.astro'],
    rules: {
      'astro/jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true },
      ],
    },
  },
);
