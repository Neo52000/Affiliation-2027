import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  QUIZ_FACULTATIVES,
  QUIZ_FORMAT,
  QUIZ_FORMAT_METIER_CONNU,
  QUIZ_QUESTIONS,
  QUIZ_QUESTIONS_METIER_CONNU,
} from './quiz-libelles';

const racine = new URL('../', import.meta.url).pathname;
const NOMBRES = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept'];
const enLettres = (n: number) => (n === 1 ? 'une' : NOMBRES[n]!);

describe('format du quiz', () => {
  const quiz = readFileSync(join(racine, 'components/islands/Quiz.tsx'), 'utf8');
  const numerotees = [...quiz.matchAll(/>\s*(\d)\. ([^<]+)</g)].map((m) => m[2]!);

  it('correspond aux questions numérotées de Quiz.tsx', () => {
    const facultatives = numerotees.filter((q) => /facultati/i.test(q));
    expect(numerotees.length - facultatives.length).toBe(QUIZ_QUESTIONS);
    expect(facultatives.length).toBe(QUIZ_FACULTATIVES);
  });

  it('écrit en lettres les mêmes nombres', () => {
    expect(QUIZ_FORMAT).toBe(
      `${enLettres(QUIZ_QUESTIONS).replace('une', 'un')} questions et ${enLettres(QUIZ_FACULTATIVES)} facultative`,
    );
    expect(QUIZ_FORMAT_METIER_CONNU).toBe(
      `${NOMBRES[QUIZ_QUESTIONS_METIER_CONNU]} questions et ${enLettres(QUIZ_FACULTATIVES)} facultative`,
    );
  });

  it('n’est plus recopié en dur dans les pages et composants', () => {
    const fichiers: string[] = [];
    const parcourir = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) parcourir(p);
        else if (/\.(astro|tsx)$/.test(n)) fichiers.push(p);
      }
    };
    parcourir(join(racine, 'pages'));
    parcourir(join(racine, 'components'));
    const fautifs = fichiers.filter((f) =>
      /\b(cinq|quatre|[45]) questions\b/i.test(readFileSync(f, 'utf8')),
    );
    expect(fautifs).toEqual([]);
  });
});
