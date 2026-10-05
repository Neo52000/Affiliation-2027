/**
 * Capture email « Recevoir un rappel avant mon échéance » (section 12).
 * Double opt-in délégué au fournisseur d'emailing (OUTIL_EMAIL — TODO.md #7) :
 * tant que EMAIL_API_KEY n'est pas configurée dans Netlify, répond 503 et le
 * formulaire reste désactivé côté site. La clé ne vit qu'en variable
 * d'environnement, jamais dans le dépôt.
 *
 * Implémentation prête pour Brevo (contacts/doubleOptinConfirmation) ; adapter
 * API_URL/payload si OUTIL_EMAIL est un autre fournisseur.
 */
import { validerDemandeRappel } from '../../src/lib/email-capture.ts';

const API_URL = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
// À renseigner avec OUTIL_EMAIL (TODO.md #7) : id du template de confirmation
// double opt-in et id de liste créés chez le fournisseur.
const TEMPLATE_ID = Number(process.env['EMAIL_DOI_TEMPLATE_ID'] ?? 0);
const LISTE_ID = Number(process.env['EMAIL_LISTE_ID'] ?? 0);

const json = (statut: number, corps: unknown) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json(405, { erreur: 'Méthode non autorisée.' });
  }

  const cle = process.env['EMAIL_API_KEY'];
  if (!cle || !TEMPLATE_ID || !LISTE_ID) {
    return json(503, {
      erreur: "Le rappel par email n'est pas encore activé sur ce site.",
    });
  }

  let brut: unknown;
  try {
    brut = await request.json();
  } catch {
    return json(400, { erreur: 'Corps JSON attendu.' });
  }

  const validation = validerDemandeRappel(brut);
  if (!validation.ok) {
    return json(400, { erreur: validation.erreur });
  }

  const origine = new URL(request.url).origin;
  const reponse = await fetch(API_URL, {
    method: 'POST',
    headers: { 'api-key': cle, 'content-type': 'application/json' },
    body: JSON.stringify({
      email: validation.demande.email,
      attributes: validation.demande.metier ? { METIER: validation.demande.metier } : {},
      includeListIds: [LISTE_ID],
      templateId: TEMPLATE_ID,
      redirectionUrl: `${origine}/outils/echeance?confirmation=ok`,
    }),
  });

  if (!reponse.ok) {
    return json(502, { erreur: "L'inscription a échoué, réessayez plus tard." });
  }
  return json(200, {
    ok: true,
    message: 'Vérifiez votre boîte mail pour confirmer votre inscription (double opt-in).',
  });
}
