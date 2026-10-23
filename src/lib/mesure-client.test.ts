import { describe, expect, it, vi } from 'vitest';
import { envoyerMesure, syntheseParOutil, syntheseQuiz } from './mesure-client';

describe('envoyerMesure', () => {
  it('envoie l’événement par sendBeacon', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });
    envoyerMesure({ type: 'quiz_termine', outil: 'abby', emplacement: 'quiz' });
    expect(sendBeacon).toHaveBeenCalledWith(
      '/api/mesure',
      '{"type":"quiz_termine","outil":"abby","emplacement":"quiz"}',
    );
    vi.unstubAllGlobals();
  });

  it('ne lève rien sans sendBeacon', () => {
    vi.stubGlobal('navigator', {});
    expect(() =>
      envoyerMesure({ type: 'clic_editeur', outil: 'abby', emplacement: 'quiz-abby' }),
    ).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe('syntheseParOutil', () => {
  it('cumule quiz et clics par logiciel, clics décroissants', () => {
    const t = (type: 'quiz_termine' | 'clic_editeur', outil: string, n: number) => ({
      jour: '2026-10-23',
      type,
      outil,
      emplacement: 'x',
      n,
    });
    expect(
      syntheseParOutil([
        t('quiz_termine', 'abby', 3),
        t('clic_editeur', 'abby', 1),
        t('clic_editeur', 'tiime', 2),
        t('clic_editeur', 'tiime', 2),
      ]),
    ).toEqual([
      { outil: 'tiime', quiz: 0, clics: 4 },
      { outil: 'abby', quiz: 3, clics: 1 },
    ]);
  });
});

describe('syntheseQuiz', () => {
  it('compte les quiz commencés et terminés, « aucun » compris, hors clics', () => {
    const t = (
      type: 'quiz_commence' | 'quiz_termine' | 'clic_editeur',
      outil: string,
      n: number,
    ) => ({
      jour: '2026-10-23',
      type,
      outil,
      emplacement: 'quiz',
      n,
    });
    const totaux = [
      t('quiz_commence', 'aucun', 10),
      t('quiz_termine', 'abby', 4),
      t('quiz_termine', 'aucun', 1),
      t('clic_editeur', 'abby', 2),
    ];
    expect(syntheseQuiz(totaux)).toEqual({ commences: 10, termines: 5 });
    expect(syntheseParOutil(totaux)).toEqual([{ outil: 'abby', quiz: 4, clics: 2 }]);
  });
});
