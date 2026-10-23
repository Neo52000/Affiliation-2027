/**
 * Vérification Google Search Console par balise meta (méthode « Balise HTML »).
 * Le jeton vient de la variable d'environnement GOOGLE_SITE_VERIFICATION, posée
 * dans Netlify (aucun commit) ; plusieurs jetons séparés par des virgules sont
 * acceptés (une propriété par origine : affiliation2027.netlify.app puis
 * efactureguide.fr). Un jeton n'est pas un secret, mais seul un format strict
 * est publié : rien d'autre ne peut entrer dans l'attribut content.
 */
const FORMAT_JETON = /^[A-Za-z0-9_-]{20,100}$/;

export function jetonsVerificationGoogle(brut: string | undefined): string[] {
  return [
    ...new Set(
      (brut ?? '')
        .split(',')
        .map((j) => j.trim())
        .filter((j) => FORMAT_JETON.test(j)),
    ),
  ];
}
