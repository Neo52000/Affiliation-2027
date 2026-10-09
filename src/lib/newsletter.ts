/**
 * Inscription à la newsletter : traitement du formulaire HTML (sans JavaScript)
 * reçu par la fonction Netlify /api/newsletter. Double opt-in délégué à Brevo
 * (contacts/doubleOptinConfirmation) : le contact n'entre dans la liste qu'après
 * avoir cliqué le lien de confirmation. La clé API ne vit qu'en variable
 * d'environnement. Chaque issue renvoie (303) vers une page d'état statique.
 */
import { validerNewsletter } from './email-capture.ts';

export const API_BREVO_DOI = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';

export const PAGES_NEWSLETTER = {
  envoyee: '/newsletter/verifiez-vos-emails',
  confirmee: '/newsletter/confirmee',
  erreur: '/newsletter/erreur',
  adresse: '/newsletter/adresse-invalide',
  indisponible: '/newsletter/indisponible',
} as const;

/**
 * Variables (portée Functions, contexte Production seulement) : la clé Brevo,
 * la liste de la newsletter, distincte de celle du rappel d'échéance, et un
 * modèle de confirmation propre à la newsletter, pour que l'email validé décrive
 * exactement la finalité consentie.
 */
export interface EnvNewsletter {
  EMAIL_API_KEY?: string | undefined;
  NEWSLETTER_DOI_TEMPLATE_ID?: string | undefined;
  NEWSLETTER_LISTE_ID?: string | undefined;
}

const SANS_CACHE = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

const versPage = (origine: string, page: string) =>
  new Response(null, { status: 303, headers: { location: `${origine}${page}`, ...SANS_CACHE } });

const refus = (statut: number, message: string, entetes: Record<string, string> = {}) =>
  new Response(message, {
    status: statut,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...SANS_CACHE, ...entetes },
  });

const entierPositif = (v: string | undefined): number | null =>
  v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null;

export async function traiterInscription(
  requete: Request,
  env: EnvNewsletter,
  f: typeof fetch = fetch,
): Promise<Response> {
  if (requete.method !== 'POST') {
    return refus(405, 'Méthode non autorisée.', { allow: 'POST' });
  }
  const origine = new URL(requete.url).origin;
  // Formulaire posté depuis une autre origine : refusé (le navigateur envoie Origin sur un POST).
  const origineAppelante = requete.headers.get('origin');
  if (origineAppelante !== null && origineAppelante !== origine) {
    return refus(403, 'Origine refusée.');
  }
  const type = requete.headers.get('content-type') ?? '';
  if (!type.startsWith('application/x-www-form-urlencoded')) {
    return refus(415, 'Formulaire attendu.');
  }

  const texte = await requete.text();
  if (texte.length > 2000) return versPage(origine, PAGES_NEWSLETTER.erreur);
  const validation = validerNewsletter(new URLSearchParams(texte));
  // Un robot reçoit la même réponse qu'un humain, sans qu'aucun email ne parte.
  if (!validation.ok && validation.motif === 'robot') {
    return versPage(origine, PAGES_NEWSLETTER.envoyee);
  }
  if (!validation.ok) {
    return versPage(
      origine,
      validation.motif === 'email' ? PAGES_NEWSLETTER.adresse : PAGES_NEWSLETTER.erreur,
    );
  }

  const cle = env.EMAIL_API_KEY;
  const modele = entierPositif(env.NEWSLETTER_DOI_TEMPLATE_ID);
  const liste = entierPositif(env.NEWSLETTER_LISTE_ID);
  if (!cle || modele === null || liste === null) {
    return versPage(origine, PAGES_NEWSLETTER.indisponible);
  }

  try {
    const reponse = await f(API_BREVO_DOI, {
      method: 'POST',
      headers: { 'api-key': cle, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email: validation.email,
        includeListIds: [liste],
        templateId: modele,
        redirectionUrl: `${origine}${PAGES_NEWSLETTER.confirmee}`,
      }),
    });
    if (!reponse.ok) {
      console.error(`newsletter : Brevo a répondu HTTP ${reponse.status}`);
      return versPage(origine, PAGES_NEWSLETTER.erreur);
    }
  } catch {
    console.error('newsletter : Brevo injoignable');
    return versPage(origine, PAGES_NEWSLETTER.erreur);
  }
  return versPage(origine, PAGES_NEWSLETTER.envoyee);
}
