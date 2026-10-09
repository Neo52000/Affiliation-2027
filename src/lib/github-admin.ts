/**
 * Client GitHub du back office /admin, exécuté dans le navigateur de l'éditeur.
 * Tous les appels passent par le relais same-origin /admin/gh (fonction Netlify
 * limitée à ce dépôt) : les pages gardent connect-src 'self'. Le jeton
 * (fine-grained, limité à ce dépôt) n'existe qu'en mémoire.
 *
 * Une publication = un commit unique sur une branche back-office/…, puis une
 * pull request. La mise en ligne n'est proposée que si GitHub confirme : CI
 * verte sur ce commit précis, fichiers attendus seulement, branche à jour.
 *
 * Permissions du jeton, appel par appel : Metadata R (dépôt, règles de main),
 * Contents R (contents, git/ref), Contents W (git/blobs, trees, commits, refs,
 * fusion), Pull requests R/W (lecture, création, fermeture), Actions R (runs).
 */
import { PREFIXE_RELAIS } from './admin-proxy.ts';

export interface Depot {
  proprietaire: string;
  nom: string;
  branche: string;
}

export class ErreurGitHub extends Error {
  constructor(
    readonly statut: number,
    message: string,
  ) {
    super(message);
  }
}

/** Fichier à écrire (texte ou octets) ou à supprimer (contenu null). */
export interface FichierPublie {
  chemin: string;
  contenu: string | Uint8Array | null;
}

export interface Publication {
  numero: number;
  url: string;
  branche: string;
  sha: string;
  titre: string;
  /** Chemins écrits par cette session ; null pour une demande rechargée. */
  chemins: string[] | null;
}

export type EtatCi = 'en_attente' | 'en_cours' | 'reussie' | 'echouee' | 'absente';

export interface EtatPublication {
  ouverte: boolean;
  fusionnee: boolean;
  ci: EtatCi;
  /** Raisons qui empêchent la mise en ligne ; vide = prête. */
  blocages: string[];
}

export interface Acces {
  /** Date d'expiration annoncée par GitHub pour ce jeton. */
  expiration: Date;
}

/** Règles exigées sur main (ruleset), faute de quoi le back office ne publie pas. */
export const REGLES_MAIN = [
  'deletion',
  'non_fast_forward',
  'pull_request',
  'required_status_checks',
];
const EXPIRATION_MAX_JOURS = 90;

export function octetsVersBase64(octets: Uint8Array): string {
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) {
    binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  }
  return btoa(binaire);
}

export function base64VersTexte(base64: string): string {
  const binaire = atob(base64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binaire, (c) => c.charCodeAt(0)));
}

/** Synthèse des exécutions GitHub Actions d'un commit. */
export function syntheseCi(executions: { status: string; conclusion: string | null }[]): EtatCi {
  if (executions.length === 0) return 'absente';
  if (executions.some((e) => e.status !== 'completed')) {
    return executions.some((e) => e.status === 'in_progress') ? 'en_cours' : 'en_attente';
  }
  return executions.every((e) => e.conclusion === 'success') ? 'reussie' : 'echouee';
}

/** Nom de branche horodaté et suffixé : back-office/AAAAMMJJ-HHMMSS-xxxx. */
export function nomBranche(instant: Date, suffixe: string): string {
  const iso = instant.toISOString();
  return `back-office/${iso.slice(0, 10).replaceAll('-', '')}-${iso.slice(11, 19).replaceAll(':', '')}-${suffixe}`;
}

const suffixeAleatoire = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(2)), (o) =>
    o.toString(16).padStart(2, '0'),
  ).join('');

/** « 2026-12-01 10:00:00 UTC » (en-tête GitHub) → Date, ou null. */
export function lireExpiration(entete: string | null): Date | null {
  if (!entete) return null;
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?: UTC| \+0000)?$/.exec(entete.trim());
  const d = m ? new Date(`${m[1]}T${m[2]}Z`) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

export function clientGitHub(
  jeton: string,
  depot: Depot,
  options: { f?: typeof fetch; maintenant?: () => Date } = {},
) {
  const f = options.f ?? fetch;
  const maintenant = options.maintenant ?? (() => new Date());
  const nomComplet = `${depot.proprietaire}/${depot.nom}`;
  const base = `${PREFIXE_RELAIS}/repos/${nomComplet}`;

  async function brut(chemin: string, init: RequestInit = {}): Promise<Response> {
    // Uniquement des chemins relatifs au dépôt : jamais d'URL absolue fournie par l'API.
    if (!/^(\/[A-Za-z0-9._~?=&%,-]*)*$/.test(chemin)) {
      throw new ErreurGitHub(400, `chemin refusé : ${chemin}`);
    }
    const reponse = await f(`${base}${chemin}`, {
      ...init,
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jeton}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!reponse.ok) {
      let detail = '';
      try {
        detail = ((await reponse.json()) as { message?: string }).message ?? '';
      } catch {
        // corps vide ou non JSON
      }
      const manque = reponse.headers.get('x-accepted-github-permissions');
      throw new ErreurGitHub(
        reponse.status,
        `${detail || `HTTP ${reponse.status}`}${manque ? ` (permission attendue : ${manque})` : ''}`,
      );
    }
    return reponse;
  }

  async function appel<T>(chemin: string, init: RequestInit = {}): Promise<T> {
    const reponse = await brut(chemin, init);
    return (reponse.status === 204 ? null : await reponse.json()) as T;
  }

  const json = (methode: string, corps: unknown): RequestInit => ({
    method: methode,
    body: JSON.stringify(corps),
  });

  const ref = encodeURIComponent(depot.branche);

  return {
    /**
     * Vérifie le jeton : à portée fine (pas de scopes classiques), droit
     * d'écriture, expiration annoncée et proche (90 jours au plus).
     */
    async verifierAcces(): Promise<Acces> {
      const reponse = await brut('');
      const d = (await reponse.json()) as { permissions?: { push?: boolean } };
      if ((reponse.headers.get('x-oauth-scopes') ?? '').trim() !== '') {
        throw new ErreurGitHub(403, 'Jeton classique refusé : utilisez un jeton à portée fine.');
      }
      if (!d.permissions?.push) {
        throw new ErreurGitHub(403, 'Ce jeton ne permet pas d’écrire dans le dépôt.');
      }
      const expiration = lireExpiration(
        reponse.headers.get('github-authentication-token-expiration'),
      );
      if (!expiration) throw new ErreurGitHub(403, 'Jeton sans expiration refusé.');
      const limite = maintenant().getTime() + EXPIRATION_MAX_JOURS * 24 * 3600 * 1000;
      if (expiration.getTime() > limite) {
        throw new ErreurGitHub(403, `Jeton valable plus de ${EXPIRATION_MAX_JOURS} jours refusé.`);
      }
      return { expiration };
    },

    /** Règles manquantes sur main (vide = branche protégée comme exigé). */
    async reglesManquantes(): Promise<string[]> {
      const regles = await appel<
        {
          type: string;
          parameters?: { required_status_checks?: { context: string }[] };
        }[]
      >(`/rules/branches/${ref}`);
      const types = new Set(regles.map((r) => r.type));
      const manquantes = REGLES_MAIN.filter((t) => !types.has(t));
      const verify = regles.some(
        (r) =>
          r.type === 'required_status_checks' &&
          (r.parameters?.required_status_checks ?? []).some((c) => c.context === 'verify'),
      );
      if (types.has('required_status_checks') && !verify)
        manquantes.push('contrôle requis « verify »');
      return manquantes;
    },

    /** Contenu texte d'un fichier de la branche principale, avec le sha de son blob. */
    async lireFichier(chemin: string): Promise<{ texte: string; sha: string }> {
      const d = await appel<{ content: string; encoding: string; sha: string }>(
        `/contents/${chemin}?ref=${ref}`,
      );
      if (d.encoding !== 'base64') throw new ErreurGitHub(500, `encodage inattendu : ${chemin}`);
      return { texte: base64VersTexte(d.content), sha: d.sha };
    },

    /** Noms des fichiers d'un dossier de la branche principale ([] s'il n'existe pas). */
    async listerDossier(chemin: string): Promise<string[]> {
      try {
        const d = await appel<{ name: string; type: string }[]>(`/contents/${chemin}?ref=${ref}`);
        return d.filter((e) => e.type === 'file').map((e) => e.name);
      } catch (e) {
        if (e instanceof ErreurGitHub && e.statut === 404) return [];
        throw e;
      }
    },

    /**
     * Un commit unique sur une nouvelle branche, puis la pull request vers main.
     * `attendus` : sha des fichiers tels que chargés ; si main a changé entretemps,
     * la publication est refusée (pas d'écrasement silencieux).
     */
    async publier(
      fichiers: FichierPublie[],
      attendus: Record<string, string>,
      estAutorise: (chemin: string) => boolean,
      message: string,
      corps: string,
      instant: Date,
    ): Promise<Publication> {
      const interdits = fichiers.filter((x) => !estAutorise(x.chemin));
      if (interdits.length > 0) {
        throw new ErreurGitHub(400, `chemin non autorisé : ${interdits[0]!.chemin}`);
      }
      for (const [chemin, sha] of Object.entries(attendus)) {
        const actuel = await appel<{ sha: string }>(`/contents/${chemin}?ref=${ref}`);
        if (actuel.sha !== sha) {
          throw new ErreurGitHub(
            409,
            `${chemin} a changé sur le site depuis le chargement : rechargez avant de publier.`,
          );
        }
      }
      const tete = await appel<{ object: { sha: string } }>(`/git/ref/heads/${ref}`);
      const parent = tete.object.sha;
      const commitParent = await appel<{ tree: { sha: string } }>(`/git/commits/${parent}`);

      const arbre = [];
      for (const fichier of fichiers) {
        if (fichier.contenu === null) {
          arbre.push({ path: fichier.chemin, mode: '100644', type: 'blob', sha: null });
          continue;
        }
        const octets =
          typeof fichier.contenu === 'string'
            ? new TextEncoder().encode(fichier.contenu)
            : fichier.contenu;
        const blob = await appel<{ sha: string }>(
          '/git/blobs',
          json('POST', { content: octetsVersBase64(octets), encoding: 'base64' }),
        );
        arbre.push({ path: fichier.chemin, mode: '100644', type: 'blob', sha: blob.sha });
      }

      const tree = await appel<{ sha: string }>(
        '/git/trees',
        json('POST', { base_tree: commitParent.tree.sha, tree: arbre }),
      );
      const commit = await appel<{ sha: string }>(
        '/git/commits',
        json('POST', { message, tree: tree.sha, parents: [parent] }),
      );
      const branche = nomBranche(instant, suffixeAleatoire());
      await appel('/git/refs', json('POST', { ref: `refs/heads/${branche}`, sha: commit.sha }));
      const pr = await appel<{ number: number; html_url: string; title: string }>(
        '/pulls',
        json('POST', { title: message, head: branche, base: depot.branche, body: corps }),
      );
      return {
        numero: pr.number,
        url: pr.html_url,
        branche,
        sha: commit.sha,
        titre: pr.title,
        chemins: fichiers.map((x) => x.chemin),
      };
    },

    /** Publications du back office encore ouvertes (pull requests back-office/…). */
    async publicationsOuvertes(): Promise<Publication[]> {
      const prs = await appel<
        { number: number; html_url: string; title: string; head: { ref: string; sha: string } }[]
      >('/pulls?state=open&per_page=30');
      return prs
        .filter((p) => p.head.ref.startsWith('back-office/'))
        .map((p) => ({
          numero: p.number,
          url: p.html_url,
          branche: p.head.ref,
          sha: p.head.sha,
          titre: p.title,
          chemins: null,
        }));
    },

    /**
     * État d'une publication et raisons qui empêchent sa mise en ligne : tête
     * inchangée, base main, fichiers attendus seulement, branche à jour et
     * fusionnable, CI du dépôt (ci.yml) réussie sur ce commit et cette branche.
     */
    async etat(p: Publication, estAutorise: (chemin: string) => boolean): Promise<EtatPublication> {
      const pr = await appel<{
        state: string;
        merged: boolean;
        mergeable: boolean | null;
        mergeable_state: string;
        base: { ref: string };
        head: { ref: string; sha: string; repo: { full_name: string } | null };
      }>(`/pulls/${p.numero}`);
      if (pr.merged || pr.state !== 'open') {
        return { ouverte: false, fusionnee: pr.merged, ci: 'absente', blocages: ['demande close'] };
      }
      const blocages: string[] = [];
      if (pr.base.ref !== depot.branche)
        blocages.push('la demande ne vise pas la branche principale');
      if (pr.head.ref !== p.branche || pr.head.repo?.full_name !== nomComplet) {
        blocages.push('la branche de la demande a changé');
      }
      if (pr.head.sha !== p.sha)
        blocages.push('la branche a reçu un autre commit depuis sa création');

      const fichiers = await appel<{ filename: string; previous_filename?: string }[]>(
        `/pulls/${p.numero}/files?per_page=100`,
      );
      const noms = fichiers.flatMap((x) => [
        x.filename,
        ...(x.previous_filename ? [x.previous_filename] : []),
      ]);
      if (noms.some((n) => !estAutorise(n))) {
        blocages.push('la demande modifie des fichiers hors des données du back office');
      }
      if (p.chemins) {
        const attendus = new Set(p.chemins);
        if (noms.length !== attendus.size || noms.some((n) => !attendus.has(n))) {
          blocages.push(
            'les fichiers de la demande ne sont pas ceux publiés depuis ce back office',
          );
        }
      }

      const runs = await appel<{
        workflow_runs: {
          status: string;
          conclusion: string | null;
          path: string;
          head_branch: string;
          head_sha: string;
        }[];
      }>(`/actions/runs?head_sha=${p.sha}&event=pull_request&per_page=20`);
      const ci = syntheseCi(
        runs.workflow_runs.filter(
          (r) =>
            r.path === '.github/workflows/ci.yml' &&
            r.head_branch === p.branche &&
            r.head_sha === p.sha,
        ),
      );
      if (ci !== 'reussie') blocages.push('vérifications non réussies sur ce commit');
      if (pr.mergeable !== true || pr.mergeable_state !== 'clean') {
        blocages.push(
          pr.mergeable === false
            ? 'conflit avec le site en ligne'
            : `GitHub ne la déclare pas prête (${pr.mergeable_state})`,
        );
      }
      return { ouverte: true, fusionnee: false, ci, blocages };
    },

    /**
     * Mise en ligne : fusion refusée par GitHub si la tête a bougé (sha attendu)
     * ou si les règles de main ne sont pas remplies. La branche est ensuite supprimée.
     */
    async mettreEnLigne(p: Publication): Promise<void> {
      await appel(`/pulls/${p.numero}/merge`, json('PUT', { sha: p.sha, merge_method: 'squash' }));
      try {
        await appel(`/git/refs/heads/${p.branche}`, { method: 'DELETE' });
      } catch {
        // branche déjà supprimée : sans effet sur la mise en ligne
      }
    },

    /** Abandon d'une publication : pull request fermée et branche supprimée. */
    async abandonner(p: Publication): Promise<void> {
      await appel(`/pulls/${p.numero}`, json('PATCH', { state: 'closed' }));
      try {
        await appel(`/git/refs/heads/${p.branche}`, { method: 'DELETE' });
      } catch {
        // déjà supprimée
      }
    },
  };
}

export type ClientGitHub = ReturnType<typeof clientGitHub>;
