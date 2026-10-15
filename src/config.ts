/**
 * Configuration du site : point unique de vérité pour le nom, le domaine et
 * l'identification légale (LCEN, art. 6). Aucune de ces valeurs n'est écrite
 * ailleurs : canonical, Open Graph, JSON-LD, sitemap, robots.txt et mentions
 * légales la lisent ici.
 *
 * Une valeur entre crochets « [...] » n'est pas encore renseignée :
 * scripts/check-placeholders.ts fait échouer le build tant qu'elle atteint dist/.
 */

/**
 * Origine publique, surchargeable par la variable d'environnement SITE_URL (sans
 * slash final). Adresse Netlify tant que efactureguide.fr n'est pas rattaché au
 * site : le jour du branchement DNS, définir SITE_URL=https://efactureguide.fr
 * dans Netlify et activer la redirection de netlify.toml.
 */
const SITE_URL_DEFAUT = 'https://affiliation2027.netlify.app';
// `globalThis.process` : ce module est aussi importé par le back office, côté navigateur.
const siteUrl = (globalThis.process?.env?.['SITE_URL'] || SITE_URL_DEFAUT).replace(/\/+$/, '');

export const SITE = {
  /** NOM_SITE */
  name: 'efactureguide.fr',
  /** DOMAINE — repris par `site` dans astro.config.mjs */
  url: siteUrl,
  /** EMAIL_CONTACT */
  emailContact: 'contact@efactureguide.fr',
  /**
   * EDITEUR_LEGAL (LCEN, art. 6) : raison sociale et forme (ou nom et prénom),
   * capital social et numéro RCS ou SIRET, siège social, directeur de la publication.
   * Source : Registre national des entreprises (SIREN 100 208 883).
   */
  editeurLegal:
    'Papeterie Reine & Fils, SAS au capital de 1 000 €, RCS Chaumont 100 208 883, siège social : 10 rue Toupot de Béveaux, 52000 Chaumont. Directeur de la publication : Elie Reine, président.',
  /** Téléphone de l'éditeur (LCEN, art. 6) — null : non publié, la ligne est masquée (TODO.md) */
  telephone: null as string | null,
  /** Hébergeur (LCEN, art. 6) : adresse relevée sur netlify.com (pages À propos et conditions d'utilisation) */
  adresseHebergeur: 'Netlify, Inc., 101 2nd Street, Suite 575, San Francisco, CA 94105, États-Unis',
  /** Téléphone de l'hébergeur : source tierce, à confirmer sur netlify.com (TODO.md) */
  telephoneHebergeur: '+1 415 691 1573',
  /** EXPERT_RELECTEUR — null tant que non renseigné : le bloc relecteur n'est pas affiché */
  expertRelecteur: null as string | null,
  /** Description par défaut (meta description de secours, < 155 caractères) */
  description:
    'Choisir son logiciel de facturation électronique et son compte pro, métier par métier. Comparatifs indépendants, données datées et sourcées.',
} as const;

const VALEURS_LANCEMENT = [
  SITE.name,
  SITE.url,
  SITE.emailContact,
  SITE.editeurLegal,
  SITE.telephone,
  SITE.adresseHebergeur,
  SITE.telephoneHebergeur,
].filter((v): v is string => v !== null);

/** Valeurs encore à renseigner (entre crochets) : le build échoue tant qu'il en reste dans dist/. */
export const PLACEHOLDERS_CONFIG: readonly string[] = VALEURS_LANCEMENT.filter((v) =>
  /^\[.*\]$/.test(v),
);

/**
 * L'éditeur est identifié dès que plus aucune variable de lancement n'est vide
 * ni marquée « à faire » : newsletter, rappel et annonces sont alors publiés. Décision
 * de l'éditeur : les valeurs « [...] » ne ferment pas la collecte, mais
 * check-placeholders bloque toute mise en ligne tant qu'elles subsistent.
 */
// Motif écrit sans le littéral recherché : ce module est embarqué dans le bundle
// du back office, que check-placeholders lit aussi.
export const EDITEUR_IDENTIFIE = VALEURS_LANCEMENT.every(
  (v) => v.trim() !== '' && !/TODO(?=_)|todo-(?=domaine)/.test(v),
);

/**
 * Back office /admin : dépôt GitHub qu'il édite (via l'API GitHub, avec le jeton
 * de l'éditeur) et adresse des prévisualisations Netlify des pull requests.
 */
export const ADMIN = {
  depot: { proprietaire: 'Neo52000', nom: 'Affiliation-2027', branche: 'main' },
  previsualisation: 'https://deploy-preview-{n}--affiliation2027.netlify.app',
} as const;
