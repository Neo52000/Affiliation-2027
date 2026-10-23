/**
 * Mesure agrégée sans cookie (quiz terminé, clic vers un éditeur).
 * Logique et tests : src/lib/mesure.ts. Aucune variable d'environnement :
 * Netlify Blobs est fourni par la plateforme ; la lecture des totaux exige le
 * jeton GitHub du back office (droit d'écriture sur le dépôt).
 */
import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';
import { ADMIN } from '../../src/config.ts';
import { traiterMesure, verificateurGitHub } from '../../src/lib/mesure.ts';

const DEPOT = `${ADMIN.depot.proprietaire}/${ADMIN.depot.nom}`;

export default async function handler(requete: Request): Promise<Response> {
  return traiterMesure(requete, {
    magasin: getStore({ name: 'mesure', consistency: 'strong' }),
    verifierJeton: verificateurGitHub(DEPOT),
  });
}

// Limite anti-abus : un visiteur réel envoie quelques événements par minute.
export const config: Config = {
  path: '/api/mesure',
  method: ['GET', 'POST'],
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 30,
  },
};
