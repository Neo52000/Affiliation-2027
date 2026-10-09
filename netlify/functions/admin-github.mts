/**
 * Relais du back office /admin vers l'API GitHub, limité au dépôt du site.
 * Logique et tests : src/lib/admin-proxy.ts. Aucun secret : le jeton de
 * l'éditeur arrive dans la requête et n'est envoyé qu'à api.github.com.
 */
import type { Config } from '@netlify/functions';
import { ADMIN } from '../../src/config.ts';
import { relayer } from '../../src/lib/admin-proxy.ts';

const DEPOT = `${ADMIN.depot.proprietaire}/${ADMIN.depot.nom}`;

export default async function handler(requete: Request): Promise<Response> {
  return relayer(requete, DEPOT);
}

export const config: Config = {
  path: '/admin/gh/*',
  // Une session d'édition fait quelques dizaines d'appels ; au-delà, abus.
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 120,
  },
};
