/**
 * Rappel d'échéance par email : traitement de la requête JSON du formulaire
 * (îlot RappelEmail) reçue par la fonction Netlify /api/rappel. Double opt-in
 * délégué à Brevo (contacts/doubleOptinConfirmation) ; la clé API ne vit
 * qu'en variable d'environnement. Mêmes garde-fous que la newsletter : même
 * origine, type de contenu, taille bornée, Brevo injoignable sans plantage.
 */
import { validerDemandeRappel } from './email-capture.ts';
import { API_BREVO_DOI, PAGES_NEWSLETTER } from './newsletter.ts';

/** Variables (portée Functions, contexte Production seulement). */
export interface EnvRappel {
  EMAIL_API_KEY?: string | undefined;
  EMAIL_DOI_TEMPLATE_ID?: string | undefined;
  EMAIL_LISTE_ID?: string | undefined;
}

const CORPS_MAX = 2000;

const json = (statut: number, corps: unknown) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });

const entierPositif = (v: string | undefined): number | null =>
  v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null;

export async function traiterRappel(
  requete: Request,
  env: EnvRappel,
  f: typeof fetch = fetch,
): Promise<Response> {
  if (requete.method !== 'POST') {
    return json(405, { erreur: 'Méthode non autorisée.' });
  }
  const origine = new URL(requete.url).origin;
  // Le navigateur envoie Origin sur un POST : un autre site ne peut pas déclencher d'envoi.
  const origineAppelante = requete.headers.get('origin');
  if (origineAppelante !== null && origineAppelante !== origine) {
    return json(403, { erreur: 'Origine refusée.' });
  }
  // JSON exigé : un formulaire ou un text/plain venu d'ailleurs (sans prévol CORS) est refusé.
  if (!(requete.headers.get('content-type') ?? '').startsWith('application/json')) {
    return json(415, { erreur: 'Corps JSON attendu.' });
  }

  const cle = env.EMAIL_API_KEY;
  const modele = entierPositif(env.EMAIL_DOI_TEMPLATE_ID);
  const liste = entierPositif(env.EMAIL_LISTE_ID);
  if (!cle || modele === null || liste === null) {
    return json(503, { erreur: "Le rappel par email n'est pas encore activé sur ce site." });
  }

  const texte = await requete.text();
  if (texte.length > CORPS_MAX) return json(413, { erreur: 'Requête trop volumineuse.' });
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return json(400, { erreur: 'Corps JSON attendu.' });
  }
  const validation = validerDemandeRappel(brut);
  if (!validation.ok) return json(400, { erreur: validation.erreur });

  let reponse: Response;
  try {
    reponse = await f(API_BREVO_DOI, {
      method: 'POST',
      headers: { 'api-key': cle, 'content-type': 'application/json' },
      body: JSON.stringify({
        email: validation.demande.email,
        attributes: validation.demande.metier ? { METIER: validation.demande.metier } : {},
        includeListIds: [liste],
        templateId: modele,
        // Page de confirmation qui propose le guide PDF offert.
        redirectionUrl: `${origine}${PAGES_NEWSLETTER.rappelConfirme}`,
      }),
    });
  } catch {
    return json(502, { erreur: "L'inscription a échoué, réessayez plus tard." });
  }
  if (!reponse.ok) {
    return json(502, { erreur: "L'inscription a échoué, réessayez plus tard." });
  }
  return json(200, {
    ok: true,
    message:
      'Vérifiez votre boîte mail pour confirmer votre inscription (double opt-in). Le guide PDF vous sera proposé dès la confirmation.',
  });
}
