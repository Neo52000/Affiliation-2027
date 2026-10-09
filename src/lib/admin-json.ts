/**
 * Sérialisation JSON du back office, identique à la sortie de Prettier
 * (printWidth 100, indentation 2) : un fichier publié depuis /admin passe le
 * contrôle de format de la CI sans retouche. Règles de Prettier reproduites :
 * objet non vide toujours déplié ; tableau de valeurs simples sur une ligne
 * s'il tient dans la largeur, sinon une valeur par ligne ; tableau d'objets déplié.
 */

const LARGEUR = 100;

type Json = null | boolean | number | string | Json[] | { [cle: string]: Json };

function estSimple(v: Json): v is null | boolean | number | string {
  return v === null || typeof v !== 'object';
}

function rendre(valeur: Json, retrait: number, prefixe: number): string {
  if (estSimple(valeur)) return JSON.stringify(valeur);
  const marge = ' '.repeat(retrait + 2);
  const fin = ' '.repeat(retrait);

  if (Array.isArray(valeur)) {
    if (valeur.length === 0) return '[]';
    if (valeur.every(estSimple)) {
      const enLigne = `[${valeur.map((v) => JSON.stringify(v)).join(', ')}]`;
      // prefixe = colonne de départ ; +1 pour la virgule éventuelle qui suit.
      if (prefixe + enLigne.length + 1 <= LARGEUR) return enLigne;
    }
    const elements = valeur.map((v) => marge + rendre(v, retrait + 2, marge.length));
    return `[\n${elements.join(',\n')}\n${fin}]`;
  }

  const entrees = Object.entries(valeur);
  if (entrees.length === 0) return '{}';
  const lignes = entrees.map(([cle, v]) => {
    const debut = `${marge}${JSON.stringify(cle)}: `;
    return debut + rendre(v, retrait + 2, debut.length);
  });
  return `{\n${lignes.join(',\n')}\n${fin}}`;
}

export function serialiserJson(valeur: unknown): string {
  return `${rendre(valeur as Json, 0, 0)}\n`;
}
