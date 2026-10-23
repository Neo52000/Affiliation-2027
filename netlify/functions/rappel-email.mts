/**
 * Capture email « Recevoir un rappel avant mon échéance » (section 12).
 * Logique et tests : src/lib/rappel.ts. Variables d'environnement (portée
 * Functions, contexte Production seulement, jamais dans le dépôt) :
 * EMAIL_API_KEY, EMAIL_DOI_TEMPLATE_ID, EMAIL_LISTE_ID. Sans elles, répond 503
 * et le formulaire l'indique (TODO.md #7).
 */
import type { Config } from '@netlify/functions';
import { EDITEUR_IDENTIFIE } from '../../src/config.ts';
import { traiterRappel } from '../../src/lib/rappel.ts';

export default async function handler(requete: Request): Promise<Response> {
  // Aucune collecte tant que l'éditeur n'est pas identifié (RGPD, art. 13).
  return traiterRappel(
    requete,
    EDITEUR_IDENTIFIE
      ? {
          EMAIL_API_KEY: process.env['EMAIL_API_KEY'],
          EMAIL_DOI_TEMPLATE_ID: process.env['EMAIL_DOI_TEMPLATE_ID'],
          EMAIL_LISTE_ID: process.env['EMAIL_LISTE_ID'],
        }
      : {},
  );
}

// Limite anti-abus : 5 envois par minute et par adresse IP (comme la newsletter).
export const config: Config = {
  path: '/api/rappel',
  method: 'POST',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 5,
  },
};
