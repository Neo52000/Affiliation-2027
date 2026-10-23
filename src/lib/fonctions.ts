import type { FONCTIONS_OUTIL } from './schemas';

/** Libellés publics des fonctions d'un logiciel (fiche logiciel, cas concret des fiches métier). */
export const LIBELLES_FONCTIONS_OUTIL: Record<(typeof FONCTIONS_OUTIL)[number], string> = {
  emission: 'Émission de factures électroniques',
  reception: 'Réception de factures électroniques',
  e_reporting: 'E-reporting',
  compte_pro: 'Compte professionnel',
  compta: 'Comptabilité',
  devis: 'Devis',
  acomptes: 'Factures d’acompte',
  app_mobile: 'Application mobile',
  export_comptable: 'Export comptable',
  lien_expert_comptable: 'Accès expert-comptable',
};
