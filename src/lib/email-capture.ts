/**
 * Validation de la demande de rappel par email (section 12 de la spécification).
 * Un seul formulaire : « Recevoir un rappel avant mon échéance ».
 * Double opt-in côté fournisseur ; consentement explicite exigé ici.
 */

export interface DemandeRappel {
  email: string;
  /** slug métier, facultatif */
  metier: string | null;
  /** case de consentement, jamais précochée côté formulaire */
  consentement: boolean;
}

export type ValidationRappel = { ok: true; demande: DemandeRappel } | { ok: false; erreur: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SLUG_RE = /^[a-z0-9-]{1,60}$/;

export function validerDemandeRappel(brut: unknown): ValidationRappel {
  if (typeof brut !== 'object' || brut === null) {
    return { ok: false, erreur: 'Requête invalide.' };
  }
  const o = brut as Record<string, unknown>;

  if (o['consentement'] !== true) {
    return { ok: false, erreur: 'Le consentement explicite est requis.' };
  }
  const email = typeof o['email'] === 'string' ? o['email'].trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, erreur: 'Adresse email invalide.' };
  }
  let metier: string | null = null;
  if (typeof o['metier'] === 'string' && o['metier'].trim() !== '') {
    const slug = o['metier'].trim();
    if (!SLUG_RE.test(slug)) return { ok: false, erreur: 'Métier invalide.' };
    metier = slug;
  }
  return { ok: true, demande: { email, metier, consentement: true } };
}
