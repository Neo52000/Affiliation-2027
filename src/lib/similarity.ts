/**
 * Détection de contenu dupliqué entre pages métier (règle bloquante, section 6
 * de la spécification) : shingles de 5 mots, similarité de Jaccard, échec > 0,5.
 */

export const SHINGLE_SIZE = 5;
export const JACCARD_MAX = 0.5;

/** Extrait le texte visible du <main> d'une page HTML construite. */
export function extractMainText(html: string): string {
  const main = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? html;
  return main
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Ensemble des shingles de `size` mots consécutifs. */
export function shingles(text: string, size = SHINGLE_SIZE): Set<string> {
  const mots = text.split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + size <= mots.length; i++) {
    out.add(mots.slice(i, i + size).join(' '));
  }
  return out;
}

/** Similarité de Jaccard entre deux ensembles. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface PairSimilarity {
  a: string;
  b: string;
  score: number;
}

/** Similarité de toutes les paires, triée décroissante. */
export function allPairs(pages: { nom: string; texte: string }[]): PairSimilarity[] {
  const sets = pages.map((p) => ({ nom: p.nom, set: shingles(p.texte) }));
  const out: PairSimilarity[] = [];
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      out.push({ a: sets[i]!.nom, b: sets[j]!.nom, score: jaccard(sets[i]!.set, sets[j]!.set) });
    }
  }
  return out.sort((x, y) => y.score - x.score);
}
