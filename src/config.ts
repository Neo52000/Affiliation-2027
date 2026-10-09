/**
 * Variables de lancement (section 0 de la spécification).
 * Les valeurs TODO_xxx sont des placeholders explicites : voir TODO.md.
 * Point unique de remplacement quand les vraies valeurs seront fournies.
 */
export const SITE = {
  /** NOM_SITE */
  name: 'TODO_NOM_SITE',
  /** DOMAINE — doit rester synchronisé avec `site` dans astro.config.mjs */
  url: 'https://todo-domaine.example',
  /** EMAIL_CONTACT */
  emailContact: 'TODO_EMAIL_CONTACT',
  /**
   * EDITEUR_LEGAL (LCEN, art. 6) : raison sociale et forme (ou nom et prénom),
   * capital social et numéro RCS ou SIRET, siège social, directeur de la publication.
   */
  editeurLegal: 'TODO_EDITEUR_LEGAL',
  /** Téléphone de l'éditeur (LCEN, art. 6) */
  telephone: 'TODO_TELEPHONE',
  /** Téléphone de l'hébergeur Netlify, à relever sur son site (LCEN, art. 6) */
  telephoneHebergeur: 'TODO_TELEPHONE_HEBERGEUR',
  /** EXPERT_RELECTEUR — null tant que non renseigné : le bloc relecteur n'est pas affiché */
  expertRelecteur: null as string | null,
  /** Description par défaut (meta description de secours, < 155 caractères) */
  description:
    'Choisir son logiciel de facturation électronique et son compte pro, métier par métier. Comparatifs indépendants, données datées et sourcées.',
} as const;

/**
 * L'éditeur est identifié quand nom, domaine, éditeur légal et contact sont
 * renseignés. Avant cela, aucune collecte d'email (RGPD, art. 13 : identité du
 * responsable au moment de la collecte) ni aucune annonce (LCEN : l'annonceur
 * doit pouvoir identifier l'éditeur) n'est publiée.
 */
export const EDITEUR_IDENTIFIE = [
  SITE.name,
  SITE.url,
  SITE.emailContact,
  SITE.editeurLegal,
  SITE.telephone,
  SITE.telephoneHebergeur,
].every((v) => !v.includes('TODO_') && !v.includes('todo-domaine'));

/**
 * Back office /admin : dépôt GitHub qu'il édite (via l'API GitHub, avec le jeton
 * de l'éditeur) et adresse des prévisualisations Netlify des pull requests.
 */
export const ADMIN = {
  depot: { proprietaire: 'Neo52000', nom: 'Affiliation-2027', branche: 'main' },
  previsualisation: 'https://deploy-preview-{n}--affiliation2027.netlify.app',
} as const;
