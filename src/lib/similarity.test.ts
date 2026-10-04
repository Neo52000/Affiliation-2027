import { describe, expect, it } from 'vitest';
import { allPairs, extractMainText, jaccard, shingles, JACCARD_MAX } from './similarity';

describe('extractMainText', () => {
  it('ne garde que le texte du main, sans balises ni entités', () => {
    const html =
      '<html><body><header>Menu commun</header><main><h1>Titre &amp; plus</h1><p>Un texte.</p><script>x()</script></main><footer>pied</footer></body></html>';
    const t = extractMainText(html);
    expect(t).toContain('titre');
    expect(t).toContain('un texte');
    expect(t).not.toContain('menu commun');
    expect(t).not.toContain('x()');
  });
});

describe('shingles + jaccard', () => {
  it('deux textes identiques ont une similarité de 1', () => {
    const t = 'le plombier facture ses travaux avec un acompte puis une situation';
    expect(jaccard(shingles(t), shingles(t))).toBe(1);
  });

  it('deux textes sans phrase commune de 5 mots ont une similarité de 0', () => {
    const a = shingles('un deux trois quatre cinq six sept');
    const b = shingles('huit neuf dix onze douze treize quatorze');
    expect(jaccard(a, b)).toBe(0);
  });

  it('un bloc commun court reste sous le seuil quand le texte propre domine', () => {
    const commun =
      'la facturation électronique devient obligatoire pour toutes les entreprises assujetties';
    const a = shingles(
      `${commun} le plombier gère des acomptes des situations de travaux et la tva réduite sur la rénovation des logements anciens avec attestation remise au client avant les travaux`,
    );
    const b = shingles(
      `${commun} l infirmier libéral facture des soins exonérés de tva avec tiers payant rétrocessions entre collègues et indemnités kilométriques selon la nomenclature des actes professionnels`,
    );
    expect(jaccard(a, b)).toBeLessThan(JACCARD_MAX);
  });
});

describe('allPairs', () => {
  it('trie les paires par similarité décroissante', () => {
    const pages = [
      { nom: 'a', texte: 'un deux trois quatre cinq six' },
      { nom: 'b', texte: 'un deux trois quatre cinq six' },
      { nom: 'c', texte: 'tout autre contenu sans rapport aucun ici' },
    ];
    const pairs = allPairs(pages);
    expect(pairs[0]).toMatchObject({ a: 'a', b: 'b', score: 1 });
    expect(pairs).toHaveLength(3);
  });
});
