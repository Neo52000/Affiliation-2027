import { describe, expect, it } from 'vitest';
import { insererEspacesInsecables, verifierRedaction } from './redaction';

const NBSP = ' ';
const page = (corps: string) =>
  `<html><body><header>— entête</header><main>${corps}</main></body></html>`;
const regles = (html: string) => verifierRedaction(html).map((i) => i.regle);

describe('insererEspacesInsecables', () => {
  it('insère une insécable avant : ; ? ! » et après «', () => {
    expect(insererEspacesInsecables('<p>Statut : « agréé » ; voir ? oui !</p>')).toBe(
      `<p>Statut${NBSP}: «${NBSP}agréé${NBSP}»${NBSP}; voir${NBSP}? oui${NBSP}!</p>`,
    );
  });

  it('ne touche ni aux attributs, ni aux scripts, ni au code', () => {
    const html =
      '<a title="A : B" href="/x?y=1">lien</a><script>if (a ? b : c) x();</script><code>a : b</code><pre>c ; d</pre>';
    expect(insererEspacesInsecables(html)).toBe(html);
  });

  it('traite le texte entre deux balises en ligne', () => {
    expect(insererEspacesInsecables('<strong>Provenance</strong> : registre')).toBe(
      `<strong>Provenance</strong>${NBSP}: registre`,
    );
  });

  it('protège un script contenant un chevron', () => {
    const html = '<script>for(let i=0;i<n;i++){}</script><p>Fin :</p>';
    expect(insererEspacesInsecables(html)).toBe(
      `<script>for(let i=0;i<n;i++){}</script><p>Fin${NBSP}:</p>`,
    );
  });
});

describe('verifierRedaction', () => {
  it('accepte un texte conforme et ignore ce qui est hors de <main>', () => {
    expect(
      verifierRedaction(
        page(`<p>Statut${NBSP}: agréé, voir la <a href="/methode">méthode</a>.</p>`),
      ),
    ).toEqual([]);
  });

  it('refuse les tirets cadratins et demi-cadratins espacés, pas le trait d’union ni l’intervalle', () => {
    expect(regles(page('<p>Une incise — ici.</p>'))).toEqual(['tiret cadratin']);
    expect(regles(page('<p>Une incise – ici.</p>'))).toEqual(['tiret demi-cadratin espacé']);
    expect(regles(page('<p>Pages 10–12, porte-monnaie.</p>'))).toEqual([]);
  });

  it('exclut les tableaux et les intitulés de liens externes (titres de sources)', () => {
    expect(regles(page('<table><tr><td>—</td></tr></table>'))).toEqual([]);
    expect(regles(page('<a href="https://bofip.impots.gouv.fr/x">BOFiP — TVA</a>'))).toEqual([]);
  });

  it('refuse les espaces ordinaires que le postbuild aurait dû remplacer', () => {
    expect(regles(page('<p>Statut : agréé</p>'))).toEqual(['espace ordinaire avant : ; ? ! ou »']);
    expect(regles(page('<p>« agréé»</p>'))).toEqual(['espace ordinaire après «']);
  });

  it('refuse un mot soudé à un lien, pas une élision', () => {
    expect(regles(page('<p>voir<a href="/methode">notre méthode</a></p>'))).toEqual([
      'mot soudé à une balise',
    ]);
    expect(regles(page('<p>voir <a href="/methode">la méthode</a>et</p>'))).toEqual([
      'mot soudé à une balise',
    ]);
    expect(regles(page('<p>l’<a href="/methode">annuaire</a>, et</p>'))).toEqual([]);
  });

  it('refuse un renvoi interne, même dans l’intitulé d’un lien externe', () => {
    expect(regles(page('<a href="https://x.fr/tarifs">Page tarifs (TODO.md #13)</a>'))).toEqual([
      'renvoi interne',
    ]);
  });

  it('refuse les formules creuses et les libellés vagues', () => {
    expect(regles(page('<h2>Ce qu’il faut retenir</h2>'))).toEqual(['formule de remplissage']);
    expect(regles(page('<p>Fin. Concrètement, rien.</p>'))).toEqual([
      'début de phrase de remplissage',
    ]);
    expect(regles(page('<h2>Titre</h2><p>Voici la liste.</p>'))).toEqual([
      'début de phrase de remplissage',
    ]);
    expect(regles(page('<a href="/guides">En savoir plus</a>'))).toEqual(['libellé de lien vague']);
    expect(
      regles(
        page('<p>Ce que « gratuit » recouvre en pratique.</p>')
          .replace(/« /, `«${NBSP}`)
          .replace(/ »/, `${NBSP}»`),
      ),
    ).toEqual([]);
  });
});
