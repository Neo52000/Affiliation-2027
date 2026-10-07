/**
 * Logique pure du générateur de la présentation partenaires
 * (scripts/build-presentation.ts) : aucun accès fichier ici, tout est testable.
 * Règle : chaque chiffre, date ou extrait affiché provient des données du dépôt.
 */

/** Extraits métier affichés à l'écran, chacun rattaché à son champ source exact. */
export const EXTRAITS_METIERS = [
  {
    slug: 'plombier',
    index: 0,
    extrait: 'Plusieurs taux de TVA sur une même facture',
    tauxAffiches: true,
  },
  { slug: 'infirmier-liberal', index: 0, extrait: 'Notes d’honoraires exonérées de TVA' },
  { slug: 'vtc', index: 1, extrait: 'Factures émises en son nom par les plateformes' },
] as const;

const ENTITES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function echapperHtml(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ENTITES[c] ?? c);
}

/**
 * Typographie française : espace insécable avant % : ; ! ? » et après «,
 * pour qu'un « 5,5 % » ou un « : » ne se retrouve jamais seul en début de ligne.
 */
export function insecables(texte: string): string {
  return texte.replace(/[ \t]+([%:;!?»])/g, '\u00a0$1').replace(/«[ \t]+/g, '«\u00a0');
}

const MOTIF_CLE = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

/**
 * Remplace chaque {{cle}} par sa valeur (déjà échappée par l'appelant).
 * Lève une erreur sur une clé inconnue ou une accolade résiduelle : un gabarit
 * à moitié rempli ne doit jamais être publié.
 */
export function remplirGabarit(gabarit: string, valeurs: Record<string, string>): string {
  const rempli = gabarit.replace(MOTIF_CLE, (_m, cle: string) => {
    const v = valeurs[cle];
    if (v === undefined) throw new Error(`valeur manquante pour {{${cle}}}`);
    return v;
  });
  if (/\{\{|\}\}/.test(rempli)) throw new Error('accolades résiduelles dans le gabarit rempli');
  return rempli;
}

/**
 * Insère un bloc à la place d'un marqueur <!-- @NOM --> présent exactement une fois.
 * Remplacement par fonction : un « $& » ou « $1 » dans du code inséré reste littéral.
 */
export function insererBloc(gabarit: string, nom: string, bloc: string): string {
  const marqueur = `<!-- @${nom} -->`;
  const occurrences = gabarit.split(marqueur).length - 1;
  if (occurrences !== 1) {
    throw new Error(`marqueur ${marqueur} trouvé ${occurrences} fois (1 attendu)`);
  }
  return gabarit.replace(marqueur, () => bloc);
}

/** URL absolues d'un texte libre (JSON, MDX), ponctuation finale exclue. */
export function extraireUrls(texte: string): string[] {
  const brutes = texte.match(/https?:\/\/[^\s"'`<>()[\]{}]+/g) ?? [];
  return brutes.map((u) => u.replace(/[.,;:!?]+$/, ''));
}

/**
 * Clé de document d'une source .gouv.fr, ou null si l'URL n'en est pas une.
 * Deux URL du même document comptent pour une seule source :
 * - sans « www. », sans « / » final, sans fragment ;
 * - Légifrance : le suffixe de version /AAAA-MM-JJ est retiré ;
 * - BOFiP : le document est son identifiant BOI, sans la date de publication ;
 * - les paramètres de requête restants sont conservés (ils désignent une page) ;
 * - data.gouv.fr est exclu : on y cite une copie tierce, pas un texte officiel.
 */
export function cleSourceGouv(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const hote = u.hostname.toLowerCase().replace(/^www\./, '');
  if (!hote.endsWith('.gouv.fr') || hote === 'data.gouv.fr') return null;

  if (hote === 'bofip.impots.gouv.fr') {
    const boi = `${u.pathname}${u.search}`.match(/identifiant=(BOI-[A-Z0-9-]+)/i)?.[1];
    if (boi) return `${hote}/${boi.toUpperCase().replace(/-\d{8}$/, '')}`;
  }

  let chemin = u.pathname.replace(/\/+$/, '');
  if (hote === 'legifrance.gouv.fr') chemin = chemin.replace(/\/\d{4}-\d{2}-\d{2}$/, '');
  return `${hote}${chemin}${u.search}`;
}

/** Nombre de documents .gouv.fr distincts cités dans un ensemble de textes. */
export function compterSourcesGouv(textes: readonly string[]): number {
  const cles = new Set<string>();
  for (const texte of textes) {
    for (const url of extraireUrls(texte)) {
      const cle = cleSourceGouv(url);
      if (cle) cles.add(cle);
    }
  }
  return cles.size;
}

/** Hôtes .gouv.fr distincts (sans « www. »), dans l'ordre de première apparition. */
export function hotesGouv(urls: readonly string[]): string[] {
  const hotes: string[] = [];
  for (const url of urls) {
    if (!cleSourceGouv(url)) continue;
    const hote = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (!hotes.includes(hote)) hotes.push(hote);
  }
  return hotes;
}

function jetons(texte: string): string[] {
  return (
    texte
      .normalize('NFC')
      .toLowerCase()
      .replace(/[’']/g, ' ')
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

/**
 * Vrai si l'extrait affiché est fidèle à sa source : ses mots y figurent dans le
 * même ordre, sur une fenêtre au plus deux fois plus longue que l'extrait (une
 * parenthèse peut être omise, pas une moitié de phrase).
 */
export function verifierExtrait(source: string, extrait: string): boolean {
  const s = jetons(source);
  const e = jetons(extrait);
  if (e.length === 0) return false;
  for (let debut = 0; debut < s.length; debut++) {
    if (s[debut] !== e[0]) continue;
    let k = 1;
    let i = debut + 1;
    for (; i < s.length && k < e.length; i++) {
      if (s[i] === e[k]) k++;
    }
    if (k === e.length && i - debut <= e.length * 2) return true;
  }
  return false;
}

/** Taux de TVA cités dans un texte, dans l'ordre : « 20 % », « 10 % », « 5,5 % ». */
export function extraireTaux(texte: string): string[] {
  return [...texte.matchAll(/(\d+(?:,\d+)?)\s*%/g)].map((m) => `${m[1]}\u00a0%`);
}

/** Valeur de configuration réellement renseignée (null si placeholder TODO_). */
export function valeurConfiguree(valeur: string | null | undefined): string | null {
  if (!valeur || valeur.startsWith('TODO_') || valeur.includes('todo-')) return null;
  return valeur;
}

/** Entier au format français (espace insécable fine des milliers). */
export function formatNombre(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}
