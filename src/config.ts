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
  /** EXPERT_RELECTEUR — null tant que non renseigné : le bloc relecteur n'est pas affiché */
  expertRelecteur: null as string | null,
  /** Description par défaut (meta description de secours, < 155 caractères) */
  description:
    'Choisir son logiciel de facturation électronique et son compte pro, métier par métier. Comparatifs indépendants, données datées et sourcées.',
} as const;
