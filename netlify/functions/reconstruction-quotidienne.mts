/**
 * Reconstruction nocturne du site (fonction planifiée Netlify), seulement
 * quand elle change quelque chose : une annonce (src/data/publicites.json)
 * entre ou sort ce jour-là, ou c'est le 1er janvier (année du pied de page).
 *
 * Déclenchée à 22 h 05 et 23 h 05 UTC ; seule l'exécution qui tombe à minuit à
 * Paris (été comme hiver) agit, soit un passage par jour à 0 h 05.
 *
 * Appelle le build hook BUILD_HOOK_URL (variable secrète, portée Functions,
 * contexte Production) ; sans variable, rien ne se passe. Les fonctions
 * planifiées ne tournent que sur le déploiement publié.
 */
import type { Config } from '@netlify/functions';
import donnees from '../../src/data/publicites.json';
import { doitReconstruire, heureParis, jourParis, veille } from '../../src/lib/publicites.ts';
import { EMPLACEMENTS_PUB, FAMILLES, type Publicites } from '../../src/lib/schemas.ts';

export default async function handler(): Promise<Response> {
  const maintenant = new Date();
  if (heureParis(maintenant) !== 0) return new Response(null, { status: 204 });

  const jour = jourParis(maintenant);
  const hier = veille(jour);
  const { campagnes } = donnees as Publicites;
  if (!doitReconstruire(campagnes, EMPLACEMENTS_PUB, FAMILLES, hier, jour)) {
    console.log(`reconstruction : rien ne change le ${jour}.`);
    return new Response(null, { status: 204 });
  }

  const hook = process.env['BUILD_HOOK_URL'];
  if (!hook) {
    console.log('reconstruction : BUILD_HOOK_URL absente, rien à faire.');
    return new Response(null, { status: 204 });
  }
  const reponse = await fetch(`${hook}?trigger_title=reconstruction-${jour}`, { method: 'POST' });
  console.log(`reconstruction du ${jour} : build hook → HTTP ${reponse.status}`);
  return new Response(null, { status: reponse.ok ? 204 : 502 });
}

export const config = {
  schedule: '5 22,23 * * *',
} satisfies Config;
