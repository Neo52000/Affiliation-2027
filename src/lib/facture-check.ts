/**
 * Logique pure du vérificateur de facture (section 7 de la spécification).
 * Les mentions et leurs sources proviennent de src/data/mentions-factures.json
 * (relevé sur domaines officiels) — aucune règle inventée ici.
 * Traitement 100 % côté navigateur : aucune donnée n'est envoyée.
 */

export interface MentionFacture {
  id: string;
  libelle: string;
  regle: string;
  /** null = toujours obligatoire ; sinon la condition d'application */
  condition: string | null;
  url_source: string;
}

export interface ResultatVerification {
  /** Mentions du socle commun absentes : à ajouter */
  manquantes: MentionFacture[];
  /** Mentions conditionnelles non cochées : à vérifier selon la situation */
  aVerifier: MentionFacture[];
  /** Nombre de mentions cochées comme présentes */
  presentes: number;
  complet: boolean;
}

export function verifierFacture(
  mentions: MentionFacture[],
  presentes: Iterable<string>,
): ResultatVerification {
  const cochees = new Set(presentes);
  const manquantes = mentions.filter((m) => m.condition === null && !cochees.has(m.id));
  const aVerifier = mentions.filter((m) => m.condition !== null && !cochees.has(m.id));
  return {
    manquantes,
    aVerifier,
    presentes: cochees.size,
    complet: manquantes.length === 0,
  };
}
