/**
 * Inscription à la newsletter (formulaire HTML, double opt-in Brevo).
 * Logique et tests : src/lib/newsletter.ts. Variables d'environnement (portée
 * Functions, contexte Production seulement, jamais dans le dépôt) :
 * EMAIL_API_KEY, NEWSLETTER_DOI_TEMPLATE_ID, NEWSLETTER_LISTE_ID. Sans elles, le formulaire mène à /newsletter/indisponible.
 */
import type { Config } from '@netlify/functions';
import { EDITEUR_IDENTIFIE } from '../../src/config.ts';
import { traiterInscription } from '../../src/lib/newsletter.ts';

export default async function handler(requete: Request): Promise<Response> {
  // Tant que l'éditeur n'est pas identifié (responsable du traitement, RGPD
  // art. 13), aucune adresse n'est collectée, même par un appel direct.
  return traiterInscription(
    requete,
    EDITEUR_IDENTIFIE
      ? {
          EMAIL_API_KEY: process.env['EMAIL_API_KEY'],
          NEWSLETTER_DOI_TEMPLATE_ID: process.env['NEWSLETTER_DOI_TEMPLATE_ID'],
          NEWSLETTER_LISTE_ID: process.env['NEWSLETTER_LISTE_ID'],
        }
      : {},
  );
}

// Limite anti-abus : 5 envois par minute et par adresse IP.
export const config: Config = {
  path: '/api/newsletter',
  method: 'POST',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 5,
  },
};
