/**
 * Règles de rédaction appliquées au HTML construit (dist/), sans dépendance :
 * - insererEspacesInsecables : typographie française, appliquée au postbuild
 *   (scripts/typographie-dist.ts) au texte des pages, jamais aux attributs ni au
 *   contenu de script, style, pre, code ou textarea ;
 * - verifierRedaction : garde de build (scripts/check-redaction.ts) sur le texte
 *   de <main>. Les tableaux (données) et les intitulés de liens externes (titres
 *   de sources, cités tels quels) en sont exclus.
 */

const NBSP = ' ';

// Éléments dont le contenu n'est pas du texte courant, protégés en bloc ; puis
// commentaires, balises et texte. L'alternance est essayée de gauche à droite.
const JETONS =
  /<(script|style|pre|code|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<[^>]*>|[^<]+/gi;

/** Espace insécable avant : ; ? ! », et après «. */
export function insererEspacesInsecables(html: string): string {
  return html.replace(JETONS, (jeton: string, brut?: string) => {
    if (brut || jeton.startsWith('<')) return jeton;
    return jeton.replace(/ ([:;?!»])/g, `${NBSP}$1`).replace(/« /g, `«${NBSP}`);
  });
}

export interface Infraction {
  regle: string;
  extrait: string;
}

const ENTITES: Record<string, string> = {
  nbsp: NBSP,
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
};

function decoder(texte: string): string {
  return texte.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code =
        e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITES[e.toLowerCase()] ?? m;
  });
}

function extrait(texte: string, index: number, longueur: number): string {
  return texte
    .slice(Math.max(0, index - 40), index + longueur + 30)
    .replace(/\s+/g, ' ')
    .trim();
}

// Balises en ligne qu'Astro peut souder au mot voisin quand un retour à la ligne
// du gabarit est supprimé (« voir<a>notre méthode</a> »).
const EN_LIGNE = 'a|strong|em|b|i|abbr|time|code';
const COLLE_AVANT = new RegExp(
  `[\\p{L}\\p{N}.,;:!?)»](<(?:${EN_LIGNE})\\b[^>]*>)[\\p{L}\\p{N}«(]`,
  'u',
);
const COLLE_APRES = new RegExp(`(</(?:${EN_LIGNE})>)[\\p{L}\\p{N}«(]`, 'u');

const REGLES_TEXTE: { regle: string; motif: RegExp }[] = [
  { regle: 'tiret cadratin', motif: /—/g },
  { regle: 'tiret demi-cadratin espacé', motif: /\s–\s/g },
  { regle: 'espace ordinaire avant : ; ? ! ou »', motif: / [:;?!»]/g },
  { regle: 'espace ordinaire après «', motif: /« /g },
  { regle: 'libellé de lien vague', motif: /\ben savoir plus\b|\bdécouvrir\b/gi },
  { regle: 'formule de remplissage', motif: /\bce qu['’]il faut retenir\b/gi },
  {
    regle: 'début de phrase de remplissage',
    motif: /(?:^|[.!?:]\s+|\n\s*)(Voici|Concrètement|Autrement dit)\b/g,
  },
];

/** Infractions aux règles de rédaction dans le texte de <main>. */
export function verifierRedaction(html: string): Infraction[] {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!main) return [];
  const infractions: Infraction[] = [];

  // Contenus bruts retirés, balises gardées : on cherche les mots soudés.
  const sansBrut = main.replace(
    /<(script|style|pre|code|textarea|template)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->/gi,
    ' ',
  );
  for (const motif of [COLLE_AVANT, COLLE_APRES]) {
    const global = new RegExp(motif.source, 'gu');
    for (const m of sansBrut.matchAll(global)) {
      infractions.push({
        regle: 'mot soudé à une balise',
        extrait: extrait(sansBrut, m.index ?? 0, m[0].length),
      });
    }
  }

  // Renvois internes (« TODO.md #13 ») : interdits partout, intitulés de liens compris.
  const toutLeTexte = decoder(sansBrut.replace(/<[^>]*>/g, ' '));
  for (const m of toutLeTexte.matchAll(/\bTODO\.md\b|\bTODO #\d/g)) {
    infractions.push({
      regle: 'renvoi interne',
      extrait: extrait(toutLeTexte, m.index ?? 0, m[0].length),
    });
  }

  // Texte courant : sans tableaux ni intitulés de liens externes (titres de
  // sources cités tels quels). Chaque balise devient un saut de ligne, pour que
  // les débuts de bloc comptent comme des débuts de phrase.
  const texte = decoder(
    sansBrut
      .replace(/<table\b[\s\S]*?<\/table>/gi, '\n')
      .replace(/<a\b[^>]*\bhref="https?:[^"]*"[^>]*>[\s\S]*?<\/a>/gi, ' ')
      .replace(/<[^>]*>/g, '\n'),
  );
  for (const { regle, motif } of REGLES_TEXTE) {
    for (const m of texte.matchAll(motif)) {
      infractions.push({ regle, extrait: extrait(texte, m.index ?? 0, m[0].length) });
    }
  }
  return infractions;
}
