/**
 * Logique du back office /admin, sans DOM ni réseau : édition des données,
 * contrôle des images et liste des fichiers d'une publication. L'îlot
 * BackOffice.tsx ne fait qu'afficher et appeler ces fonctions.
 */
import { serialiserJson } from './admin-json.ts';
import type { FichierPublie } from './github-admin.ts';
import type { Affiliation, Campagne, Publicites } from './schemas.ts';

export const CHEMIN_AFFILIATION = 'src/data/affiliation.json';
export const CHEMIN_PUBLICITES = 'src/data/publicites.json';
export const DOSSIER_IMAGES = 'src/assets/publicites';

export const IMAGE_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/avif': 'avif',
};
export const IMAGE_POIDS_MAX = 300 * 1024;
export const IMAGE_LARGEUR_MIN = 640;
export const IMAGE_HAUTEUR_MIN = 360;

/** Seuls chemins qu'une publication du back office peut écrire ou supprimer. */
export function estCheminPublie(chemin: string): boolean {
  return (
    chemin === CHEMIN_AFFILIATION ||
    chemin === CHEMIN_PUBLICITES ||
    /^src\/assets\/publicites\/[a-z0-9-]{1,80}\.(webp|png|jpe?g|avif)$/.test(chemin)
  );
}

/** Type réel d'une image d'après ses premiers octets (signature), ou null. */
export function typeSelonSignature(o: Uint8Array): string | null {
  const ascii = (debut: number, fin: number) => String.fromCharCode(...o.subarray(debut, fin));
  if (o[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
  return null;
}

/** Message d'erreur d'une image d'annonce, ou null si elle convient. */
export function controleImage(i: {
  type: string;
  taille: number;
  largeur: number;
  hauteur: number;
  /** Premiers octets du fichier : le type déclaré doit correspondre au contenu. */
  entete: Uint8Array;
}): string | null {
  if (!(i.type in IMAGE_TYPES)) return 'Format accepté : WebP, PNG, JPEG ou AVIF.';
  if (typeSelonSignature(i.entete) !== i.type) {
    return 'Le contenu du fichier ne correspond pas à son format déclaré.';
  }
  if (i.taille > IMAGE_POIDS_MAX) {
    return `Image trop lourde (${Math.ceil(i.taille / 1024)} Ko) : 300 Ko au plus.`;
  }
  if (i.largeur < IMAGE_LARGEUR_MIN || i.hauteur < IMAGE_HAUTEUR_MIN) {
    return `Image trop petite (${i.largeur} × ${i.hauteur} px) : 640 × 360 px au moins.`;
  }
  return null;
}

export type StatutCampagne = 'suspendue' | 'programmée' | 'en cours' | 'terminée';

export function statutCampagne(c: Campagne, jour: string): StatutCampagne {
  if (!c.active) return 'suspendue';
  if (jour < c.debut) return 'programmée';
  if (jour > c.fin) return 'terminée';
  return 'en cours';
}

export interface SaisieLien {
  url: string;
  reseau: string;
  actif: boolean;
}

/** Applique la saisie d'un lien ; la date du lien ne change que s'il a changé. */
export function appliquerLien(
  a: Affiliation,
  slug: string,
  saisie: SaisieLien,
  jour: string,
): Affiliation {
  const avant = a.liens[slug];
  const apres = {
    url: saisie.url.trim() === '' ? null : saisie.url.trim(),
    reseau: saisie.reseau.trim() === '' ? null : saisie.reseau.trim(),
    actif: saisie.actif,
  };
  const inchange =
    avant !== undefined &&
    avant.url === apres.url &&
    avant.reseau === apres.reseau &&
    avant.actif === apres.actif;
  if (inchange) return a;
  return { date_maj: jour, liens: { ...a.liens, [slug]: { ...apres, maj: jour } } };
}

export interface Brouillon {
  affiliation: Affiliation;
  publicites: Publicites;
  /** Images ajoutées pendant la session, par nom de fichier. */
  images: Map<string, Uint8Array>;
}

export interface Depart {
  affiliation: Affiliation;
  publicites: Publicites;
  /** Images déjà présentes dans le dépôt. */
  imagesDepot: string[];
}

const identique = (a: unknown, b: unknown) => serialiserJson(a) === serialiserJson(b);

/**
 * Fichiers d'une publication : JSON modifiés, images nouvelles ou remplacées,
 * images que plus aucune campagne n'utilise après cette publication (supprimées).
 */
export function fichiersAPublier(
  depart: Depart,
  brouillon: Brouillon,
  jour: string,
): FichierPublie[] {
  const fichiers: FichierPublie[] = [];
  // Seul le contenu compte : une modification annulée ne publie rien, et la
  // date de mise à jour du fichier est posée au moment de la publication.
  if (!identique(depart.affiliation.liens, brouillon.affiliation.liens)) {
    fichiers.push({
      chemin: CHEMIN_AFFILIATION,
      contenu: serialiserJson({ ...brouillon.affiliation, date_maj: jour }),
    });
  }
  if (!identique(depart.publicites.campagnes, brouillon.publicites.campagnes)) {
    fichiers.push({
      chemin: CHEMIN_PUBLICITES,
      contenu: serialiserJson({ ...brouillon.publicites, date_maj: jour }),
    });
  }
  const utilisees = new Set(
    brouillon.publicites.campagnes.flatMap((c) => (c.image ? [c.image.fichier] : [])),
  );
  for (const [nom, octets] of brouillon.images) {
    if (utilisees.has(nom)) fichiers.push({ chemin: `${DOSSIER_IMAGES}/${nom}`, contenu: octets });
  }
  // Seules les images libérées par cette publication sont supprimées : une
  // image déjà orpheline dans le dépôt n'est pas touchée.
  const utiliseesAvant = new Set(
    depart.publicites.campagnes.flatMap((c) => (c.image ? [c.image.fichier] : [])),
  );
  for (const nom of depart.imagesDepot) {
    if (utiliseesAvant.has(nom) && !utilisees.has(nom)) {
      fichiers.push({ chemin: `${DOSSIER_IMAGES}/${nom}`, contenu: null });
    }
  }
  return fichiers;
}

/** Résumé lisible des changements (écran de publication et corps de la pull request). */
export function resumeModifications(depart: Depart, brouillon: Brouillon): string[] {
  const lignes: string[] = [];
  for (const [slug, apres] of Object.entries(brouillon.affiliation.liens)) {
    const avant = depart.affiliation.liens[slug];
    if (avant && identique(avant, apres)) continue;
    const etat = apres.actif && apres.url ? 'actif' : apres.url ? 'suspendu' : 'sans lien';
    lignes.push(`Lien affilié ${slug} : ${etat}${apres.reseau ? ` (${apres.reseau})` : ''}`);
  }
  const avantPub = new Map(depart.publicites.campagnes.map((c) => [c.id, c]));
  const apresPub = new Map(brouillon.publicites.campagnes.map((c) => [c.id, c]));
  for (const [id, c] of apresPub) {
    const a = avantPub.get(id);
    if (!a) lignes.push(`Annonce ajoutée : ${id} (${c.annonceur}, ${c.debut} → ${c.fin})`);
    else if (!identique(a, c)) lignes.push(`Annonce modifiée : ${id}`);
  }
  for (const id of avantPub.keys()) {
    if (!apresPub.has(id)) lignes.push(`Annonce supprimée : ${id}`);
  }
  return lignes;
}
