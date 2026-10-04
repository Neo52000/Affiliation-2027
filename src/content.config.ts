import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { ficheTestSchema, outilSchema } from './lib/schemas';

// Les collections metiers (Phase 3) et guides (Phase 5) seront ajoutées avec
// leurs premiers fichiers ; leurs schémas sont déjà prêts dans src/lib/schemas.ts.

const outils = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/outils' }),
  schema: outilSchema,
});

const tests = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/tests' }),
  schema: ficheTestSchema,
});

export const collections = { outils, tests };
