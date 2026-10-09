/**
 * Validation des inscriptions par email : rappel d'échéance (section 12 de la
 * spécification) et newsletter. Double opt-in côté fournisseur ; consentement
 * explicite exigé ici, case jamais précochée côté formulaire.
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

/** Issue d'un formulaire de newsletter, ou motif de refus (motif « robot » : piège rempli). */
export type ValidationNewsletter =
  { ok: true; email: string } | { ok: false; motif: 'robot' | 'consentement' | 'email' };

/** Nom du champ piège, invisible pour un humain et laissé vide. */
export const CHAMP_PIEGE = 'site_web';

/**
 * Formulaire HTML de la newsletter (application/x-www-form-urlencoded) :
 * email, case de consentement (valeur « oui ») et champ piège vide.
 */
export function validerNewsletter(champs: URLSearchParams): ValidationNewsletter {
  if ((champs.get(CHAMP_PIEGE) ?? '') !== '') return { ok: false, motif: 'robot' };
  if (champs.get('consentement') !== 'oui') return { ok: false, motif: 'consentement' };
  const email = (champs.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, motif: 'email' };
  return { ok: true, email };
}
