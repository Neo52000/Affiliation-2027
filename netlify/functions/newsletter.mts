/**
 * Inscription à la newsletter (formulaire HTML, double opt-in Brevo).
 * Logique et tests : src/lib/newsletter.ts. Variables d'environnement (portée
 * Functions, contexte Production seulement, jamais dans le dépôt) :
 * EMAIL_API_KEY, NEWSLETTER_DOI_TEMPLATE_ID, NEWSLETTER_LISTE_ID. Sans elles, le formulaire mène à /newsletter/indisponible.
 */
import type { Config } from '@netlify/functions';
import { traiterInscription } from '../../src/lib/newsletter.ts';

export default async function handler(requete: Request): Promise<Response> {
  return traiterInscription(requete, {
    EMAIL_API_KEY: process.env['EMAIL_API_KEY'],
    NEWSLETTER_DOI_TEMPLATE_ID: process.env['NEWSLETTER_DOI_TEMPLATE_ID'],
    NEWSLETTER_LISTE_ID: process.env['NEWSLETTER_LISTE_ID'],
  });
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
