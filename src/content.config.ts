import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { ficheTestSchema, metierSchema, outilSchema } from './lib/schemas';

// La collection guides (Phase 5) sera ajoutée avec ses premiers fichiers ;
// son schéma est déjà prêt dans src/lib/schemas.ts.

const outils = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/outils' }),
  schema: outilSchema,
});

const metiers = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/metiers' }),
  schema: metierSchema,
});

const tests = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/tests' }),
  schema: ficheTestSchema,
});

export const collections = { outils, metiers, tests };
