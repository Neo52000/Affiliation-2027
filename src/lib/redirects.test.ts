import { describe, expect, it } from 'vitest';
import affiliation from '../data/affiliation.json';
import { liensActifs } from './liens-affilies';
import { affiliationSchema } from './schemas';
import { fichierRedirections, slugsRediriges } from './redirects';

describe('fichierRedirections', () => {
  it('génère une redirection 302 forcée par lien actif, triée par slug', () => {
    const fichier = fichierRedirections({
      tiime: 'https://aff.example.fr/t?via=x',
      abby: 'https://aff.example.fr/a',
    });
    expect(fichier.split('\n').filter((l) => l.startsWith('/go/'))).toEqual([
      '/go/abby  https://aff.example.fr/a  302!',
      '/go/tiime  https://aff.example.fr/t?via=x  302!',
    ]);
    expect(slugsRediriges(fichier)).toEqual(new Set(['abby', 'tiime']));
  });

  it('aucun lien actif : fichier commenté, sans règle (état actuel du projet)', () => {
    const fichier = fichierRedirections(liensActifs(affiliationSchema.parse(affiliation)));
    expect(fichier).toContain('Aucun lien affilié actif');
    expect(slugsRediriges(fichier).size).toBe(0);
  });

  it('refuse une URL capable d’injecter une règle', () => {
    expect(() =>
      fichierRedirections({ tiime: 'https://a.fr/\n/* https://evil.fr 200!' }),
    ).toThrow();
    expect(() => fichierRedirections({ tiime: 'http://a.fr/' })).toThrow();
  });
});

describe('liensActifs', () => {
  it('ne retient que les liens actifs avec une URL', () => {
    expect(
      liensActifs({
        date_maj: '2026-10-09',
        liens: {
          tiime: { url: 'https://a.fr/t', reseau: 'Affilae', actif: true, maj: '2026-10-09' },
          qonto: { url: 'https://a.fr/q', reseau: null, actif: false, maj: '2026-10-09' },
          abby: { url: null, reseau: null, actif: false, maj: '2026-10-09' },
        },
      }),
    ).toEqual({ tiime: 'https://a.fr/t' });
  });
});
