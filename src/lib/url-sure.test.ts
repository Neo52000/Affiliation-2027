import { describe, expect, it } from 'vitest';
import { estUrlSure } from './url-sure';

describe('estUrlSure', () => {
  it.each([
    'https://www.tiime.fr/?via=partenaire',
    'https://app.affilae.com/r/?p=abc&af=12&lp=https%3A%2F%2Fshine.fr',
    'https://exemple.fr/chemin/vers-offre',
    'https://xn--exmple-cva.fr/offre-%C3%A9t%C3%A9',
  ])('accepte %s', (u) => {
    expect(estUrlSure(u)).toBe(true);
  });

  it.each([
    ['vide', ''],
    ['http', 'http://www.tiime.fr/'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,x'],
    ['relative', '/go/tiime'],
    ['espace', 'https://exemple.fr/a b'],
    ['retour à la ligne', 'https://exemple.fr/\n/go/x https://evil.fr 302!'],
    ['guillemet', 'https://exemple.fr/"onmouseover="x'],
    ['chevron', 'https://exemple.fr/<script>'],
    ['fragment', 'https://exemple.fr/#offre'],
    ['identifiants', 'https://user:pass@exemple.fr/'],
    ['localhost', 'https://localhost/'],
    ['adresse IP', 'https://192.168.0.1/'],
    ['sans domaine', 'https://intranet/'],
    ['trop longue', `https://exemple.fr/${'a'.repeat(2050)}`],
    ['caractère nul', 'https://exemple.fr/a\u0000b'],
    ['espace sans chasse', 'https://exemple.fr/a\u200bb'],
    ['accent non encodé', 'https://exemple.fr/offre-été'],
    ['domaine homographe (о cyrillique)', 'https://qоnto.com/'],
    ['port explicite', 'https://exemple.fr:8443/'],
    ['le site lui-même (Netlify)', 'https://affiliation2027.netlify.app/go/tiime'],
    ['une prévisualisation du site', 'https://deploy-preview-3--affiliation2027.netlify.app/'],
    ['schéma en majuscules', 'HTTPS://exemple.fr/'],
    ['sans barres obliques', 'https:exemple.fr/x'],
    ['une seule barre oblique', 'https:/exemple.fr/x'],
    ['trois barres obliques', 'https:///exemple.fr/x'],
  ])('refuse : %s', (_, u) => {
    expect(estUrlSure(u)).toBe(false);
  });
});
