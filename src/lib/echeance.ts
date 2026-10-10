/**
 * Logique pure du simulateur d'échéance (section 7 de la spécification).
 * Les dates proviennent exclusivement de src/data/echeances.json, passées en
 * paramètre — aucune date en dur ici.
 */

export interface Echeance {
  id: string;
  date: string;
  obligation: string;
  concernes: string;
  statut: 'en_vigueur' | 'a_venir';
  complement: string | null;
  sources: string[];
}

export type Taille = 'ge-eti' | 'pme-tpe-micro';
export type SituationTva = 'assujetti' | 'franchise' | 'non-assujetti';

export interface SituationEcheances {
  horsChamp: boolean;
  message: string | null;
  reception: Echeance | null;
  emission: Echeance | null;
  eReporting: Echeance | null;
  checklist: string[];
}

function trouver(echeances: Echeance[], id: string): Echeance {
  const e = echeances.find((x) => x.id === id);
  if (!e) throw new Error(`échéance manquante dans echeances.json : ${id}`);
  return e;
}

export function situerEcheances(
  taille: Taille,
  tva: SituationTva,
  echeances: Echeance[],
): SituationEcheances {
  if (tva === 'non-assujetti') {
    return {
      horsChamp: true,
      message:
        "Les obligations de la réforme visent les entreprises assujetties à la TVA. Si votre structure n'est pas assujettie, votre situation demande une analyse au cas par cas : rapprochez-vous de votre expert-comptable ou consultez la documentation officielle.",
      reception: null,
      emission: null,
      eReporting: null,
      checklist: [],
    };
  }

  // La franchise en base reste assujettie à la TVA : mêmes obligations.
  const reception = trouver(echeances, 'reception-toutes-entreprises');
  const emission = trouver(
    echeances,
    taille === 'ge-eti' ? 'emission-ge-eti' : 'emission-pme-tpe-micro',
  );
  const eReporting = trouver(
    echeances,
    taille === 'ge-eti' ? 'e-reporting-ge-eti' : 'e-reporting-pme-tpe-micro',
  );

  const checklist = [
    'Choisir une plateforme agréée adaptée à votre métier et vous y inscrire.',
    'Vérifier que vos mentions obligatoires sont complètes et paramétrées.',
    reception.statut === 'en_vigueur'
      ? 'Vérifier dès maintenant que vous recevez bien les factures de vos fournisseurs via votre plateforme.'
      : 'Préparer la réception des factures fournisseurs via votre plateforme.',
    emission.statut === 'en_vigueur'
      ? 'Vérifier dès maintenant que vos factures électroniques partent bien via votre plateforme.'
      : 'Tester l’émission d’une facture électronique avant votre échéance.',
    'Prévenir votre expert-comptable et organiser l’archivage.',
  ];
  if (tva === 'franchise') {
    checklist.push(
      'Conserver la mention « TVA non applicable, art. 293 B du CGI » sur vos factures : la franchise en base ne dispense pas de la réforme.',
    );
  }

  return { horsChamp: false, message: null, reception, emission, eReporting, checklist };
}
