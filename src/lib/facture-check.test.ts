import { describe, expect, it } from 'vitest';
import mentionsData from '../data/mentions-factures.json';
import { verifierFacture, type MentionFacture } from './facture-check';

const MENTIONS = mentionsData.mentions as MentionFacture[];
const socle = MENTIONS.filter((m) => m.condition === null);
const conditionnelles = MENTIONS.filter((m) => m.condition !== null);

describe('données mentions-factures.json', () => {
  it('chaque mention porte une URL source officielle', () => {
    for (const m of MENTIONS) {
      expect(m.url_source).toMatch(/^https:\/\//);
      expect(
        /\.gouv\.fr|service-public/.test(new URL(m.url_source).hostname),
        `${m.id} : source non officielle`,
      ).toBe(true);
    }
  });

  it('aucune date de la réforme en dur dans les libellés et règles', () => {
    for (const m of MENTIONS) {
      expect(`${m.libelle} ${m.regle} ${m.condition ?? ''}`).not.toMatch(/202[5-9]/);
    }
  });
});

describe('verifierFacture', () => {
  it('rien de coché : tout le socle est manquant, toutes les conditionnelles à vérifier', () => {
    const r = verifierFacture(MENTIONS, []);
    expect(r.manquantes).toHaveLength(socle.length);
    expect(r.aVerifier).toHaveLength(conditionnelles.length);
    expect(r.complet).toBe(false);
  });

  it('tout le socle coché : complet, plus aucune manquante', () => {
    const r = verifierFacture(
      MENTIONS,
      socle.map((m) => m.id),
    );
    expect(r.manquantes).toHaveLength(0);
    expect(r.complet).toBe(true);
    expect(r.aVerifier).toHaveLength(conditionnelles.length);
  });

  it('une conditionnelle cochée sort de la liste « à vérifier »', () => {
    const cond = conditionnelles[0]!;
    const r = verifierFacture(MENTIONS, [cond.id]);
    expect(r.aVerifier.map((m) => m.id)).not.toContain(cond.id);
  });

  it('les mentions manquantes conservent règle et source (affichées à l’utilisateur)', () => {
    const r = verifierFacture(MENTIONS, []);
    for (const m of r.manquantes) {
      expect(m.regle.length).toBeGreaterThan(10);
      expect(m.url_source).toMatch(/^https:/);
    }
  });

  it('id inconnu coché : ignoré sans erreur', () => {
    const r = verifierFacture(MENTIONS, ['mention-inexistante']);
    expect(r.manquantes).toHaveLength(socle.length);
  });
});
