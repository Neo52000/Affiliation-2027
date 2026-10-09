/**
 * Contrôle des URL saisies dans le back office (liens affiliés, annonces).
 * Elles finissent dans dist/_redirects et dans des attributs href : on
 * n'accepte qu'une URL https absolue en ASCII visible (domaine international
 * saisi en punycode xn--), sans identifiants, port, fragment ni caractère
 * capable de casser une ligne de redirection ou un attribut, et jamais vers le
 * site lui-même (boucle de redirection).
 */
import { SITE } from '../config.ts';

const ASCII_VISIBLE = /^[\x21-\x7E]+$/;
const INTERDITS = /["'<>\\`#{}|^]/;
const LONGUEUR_MAX = 2048;
const NETLIFY = 'affiliation2027.netlify.app';

function estHoteDuSite(hote: string): boolean {
  return hote === new URL(SITE.url).hostname || hote === NETLIFY || hote.endsWith(`--${NETLIFY}`);
}

export function estUrlSure(brute: string): boolean {
  if (brute.length > LONGUEUR_MAX || !ASCII_VISIBLE.test(brute) || INTERDITS.test(brute)) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(brute);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.port !== '') {
    return false;
  }
  const hote = url.hostname;
  // Un nom de domaine public : au moins un point, ni localhost, ni adresse IP, ni le site.
  if (!hote.includes('.') || hote === 'localhost' || /^[\d.]+$/.test(hote) || hote.includes(':')) {
    return false;
  }
  return !estHoteDuSite(hote);
}

export const MESSAGE_URL_SURE =
  'URL https complète attendue, en caractères ASCII (domaine accentué en xn--), sans espace, guillemet, fragment (#), port ni identifiants, et hors de ce site.';

/** Caractères de contrôle ou invisibles (dont U+202E, U+200B) : interdits dans les textes saisis. */
export const INVISIBLES = /[\p{Cc}\p{Cf}]/u;
