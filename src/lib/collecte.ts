/**
 * Ouverture des formulaires email, décidée au build (rendu serveur uniquement) :
 * éditeur identifié ET prestataire d'envoi (Brevo) configuré dans les variables
 * d'environnement Netlify. Sans cela, aucun formulaire n'est affiché : un visiteur
 * ne doit pas pouvoir saisir une adresse que le site ne saurait pas traiter.
 * Seule la présence des variables est lue, jamais leur valeur.
 */
import { EDITEUR_IDENTIFIE } from '../config.ts';

type Env = Record<string, string | undefined>;

const presentes = (env: Env, noms: string[]) => noms.every((n) => (env[n] ?? '').trim() !== '');

export function newsletterOuverte(env: Env, editeurIdentifie = EDITEUR_IDENTIFIE): boolean {
  return (
    editeurIdentifie &&
    presentes(env, ['EMAIL_API_KEY', 'NEWSLETTER_DOI_TEMPLATE_ID', 'NEWSLETTER_LISTE_ID'])
  );
}

export function rappelOuvert(env: Env, editeurIdentifie = EDITEUR_IDENTIFIE): boolean {
  return (
    editeurIdentifie && presentes(env, ['EMAIL_API_KEY', 'EMAIL_DOI_TEMPLATE_ID', 'EMAIL_LISTE_ID'])
  );
}

/** Variables du build courant (Node) ; vide hors Node. */
export const ENV_BUILD: Env = globalThis.process?.env ?? {};
