import { describe, expect, it } from 'vitest';
import affiliation from '../data/affiliation.json';
import { blocRedirections, injecterBloc, MARQUEUR_DEBUT, MARQUEUR_FIN } from './redirects';

describe('blocRedirections', () => {
  it('génère une redirection 302 force par lien renseigné, triée par slug', () => {
    const bloc = blocRedirections({
      tiime: 'https://aff.example/t',
      abby: 'https://aff.example/a',
      qonto: null,
    });
    expect(bloc.indexOf('/go/abby')).toBeLessThan(bloc.indexOf('/go/tiime'));
    expect(bloc).toContain('status = 302');
    expect(bloc).toContain('force = true');
    expect(bloc).not.toContain('/go/qonto');
  });

  it('tous les liens null : bloc vide commenté (état actuel du projet, TODO #6)', () => {
    const bloc = blocRedirections(affiliation.liens);
    expect(bloc).toContain('aucun lien affilié renseigné');
    expect(bloc).not.toContain('[[redirects]]');
  });
});

describe('injecterBloc', () => {
  const bloc = blocRedirections({ tiime: 'https://aff.example/t' });

  it('remplace le bloc existant entre marqueurs sans toucher au reste', () => {
    const toml = `[build]\n  command = "pnpm build"\n\n${MARQUEUR_DEBUT}\nancien contenu\n${MARQUEUR_FIN}\n`;
    const resultat = injecterBloc(toml, bloc);
    expect(resultat).toContain('[build]');
    expect(resultat).toContain('/go/tiime');
    expect(resultat).not.toContain('ancien contenu');
  });

  it('ajoute le bloc en fin de fichier quand les marqueurs sont absents', () => {
    const resultat = injecterBloc('[build]\n  command = "x"\n', bloc);
    expect(resultat).toContain(MARQUEUR_DEBUT);
    expect(resultat.trimEnd().endsWith(MARQUEUR_FIN)).toBe(true);
  });

  it('est idempotent : deux injections successives donnent le même fichier', () => {
    const une = injecterBloc('[build]\n', bloc);
    expect(injecterBloc(une, bloc)).toBe(une);
  });
});
