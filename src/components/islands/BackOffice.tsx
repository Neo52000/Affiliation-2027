import { useEffect, useRef, useState } from 'preact/hooks';
import {
  appliquerLien,
  CHEMIN_AFFILIATION,
  CHEMIN_PUBLICITES,
  controleImage,
  DOSSIER_IMAGES,
  estCheminPublie,
  fichiersAPublier,
  IMAGE_TYPES,
  resumeModifications,
  statutCampagne,
  type Brouillon,
  type Depart,
} from '../../lib/admin-modele';
import {
  clientGitHub,
  ErreurGitHub,
  type ClientGitHub,
  type Depot,
  type EtatPublication,
  type Publication,
} from '../../lib/github-admin';
import { jourParis, memeEditeur } from '../../lib/publicites';
import {
  affiliationSchema,
  campagneSchema,
  EMPLACEMENTS_PUB,
  lienAffiliationSchema,
  publicitesSchema,
  type Campagne,
} from '../../lib/schemas';

/**
 * Back office : liens d'affiliation et espaces publicitaires. Les données sont
 * les fichiers JSON du dépôt ; une publication ouvre une pull request que la
 * CI vérifie, et la mise en ligne n'est possible qu'une fois la CI verte.
 *
 * Le jeton GitHub ne vit qu'en mémoire (jamais de stockage web) : il est
 * effacé à la déconnexion, en quittant la page, après 30 minutes d'inactivité
 * et sur tout refus d'authentification.
 */

interface Props {
  depot: Depot;
  /** Adresse de prévisualisation Netlify ; {n} = numéro de la pull request. */
  previsualisation: string;
  outils: { slug: string; nom: string; urlOfficielle: string }[];
  familles: { slug: string; label: string }[];
}

const INACTIVITE_MAX = 30 * 60 * 1000;
/** Préavis avant la fermeture pour inactivité (WCAG 2.2.1 : au moins 20 s). */
const PREAVIS = 2 * 60 * 1000;
/** Libellés visibles des champs, pour le récapitulatif des erreurs d'une campagne. */
const LIBELLES_CHAMPS: Record<string, string> = {
  id: 'Identifiant',
  annonceur: 'Annonceur',
  annonceur_legal: 'Raison sociale et SIREN',
  outil: 'Logiciel comparé',
  emplacement: 'Emplacement',
  familles: 'Familles ciblées',
  titre: 'Titre',
  texte: 'Texte',
  cta: 'Libellé du bouton',
  url: 'URL de destination',
  debut: 'Début',
  fin: 'Fin',
  image: 'Image',
  'image.fichier': 'Image',
  'image.alt': 'Texte alternatif',
};
const LIBELLES_EMPLACEMENT: Record<(typeof EMPLACEMENTS_PUB)[number], string> = {
  accueil: 'Accueil (fin de page)',
  guides: 'Guides (fin d’article)',
  familles: 'Pages famille de métiers (fin de page)',
};
const LIBELLES_CI: Record<EtatPublication['ci'], string> = {
  absente: 'vérifications pas encore démarrées',
  en_attente: 'vérifications en file d’attente',
  en_cours: 'vérifications en cours',
  reussie: 'vérifications réussies',
  echouee: 'vérifications en échec',
};

const hote = (u: string): string => {
  try {
    return new URL(u).hostname;
  } catch {
    return '';
  }
};
const messageErreur = (e: unknown): string => {
  if (e instanceof ErreurGitHub) {
    if (e.statut === 401) return 'Jeton refusé par GitHub (expiré ou mal copié).';
    if (e.statut === 403) return `Accès refusé : ${e.message}`;
    if (e.statut === 404) return 'Dépôt ou fichier introuvable avec ce jeton (portée du jeton ?).';
    if (e.statut === 405 || e.statut === 409) return `GitHub refuse l’opération : ${e.message}`;
    return `Erreur GitHub ${e.statut} : ${e.message}`;
  }
  return 'Réseau indisponible ou réponse inattendue. Réessayez.';
};

/** Erreurs Zod regroupées par champ (premier message par chemin). */
function erreursParChamp(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const r: Record<string, string> = {};
  for (const i of issues) {
    const cle = i.path.map(String).join('.') || '_';
    r[cle] ??= i.message;
  }
  return r;
}

type SaisieCampagne = Omit<Campagne, 'image'> & {
  imageAlt: string;
  /** Image existante conservée (nom de fichier) ou null. */
  imageExistante: string | null;
  /** Nouvelle image choisie pendant la session. */
  imageNouvelle: { octets: Uint8Array; ext: string; apercu: string } | null;
};

const campagneVide = (jour: string): SaisieCampagne => ({
  id: '',
  annonceur: '',
  annonceur_legal: '',
  outil: null,
  emplacement: 'accueil',
  familles: [],
  titre: '',
  texte: '',
  cta: '',
  url: '',
  debut: jour,
  fin: jour,
  active: true,
  imageAlt: '',
  imageExistante: null,
  imageNouvelle: null,
});

const versSaisie = (c: Campagne): SaisieCampagne => ({
  ...c,
  imageAlt: c.image?.alt ?? '',
  imageExistante: c.image?.fichier ?? null,
  imageNouvelle: null,
});

function Champ(p: {
  id: string;
  label: string;
  erreur?: string | undefined;
  aide?: string;
  /** Erreur annoncée dès son apparition (champ validé à l'envoi, pas à la frappe). */
  alerte?: boolean;
  /** Change à chaque essai : l'erreur est recréée, donc réannoncée même identique. */
  cleErreur?: number;
  children: (attrs: Record<string, unknown>) => preact.ComponentChildren;
}) {
  const decrit = [p.aide ? `${p.id}-aide` : '', p.erreur ? `${p.id}-erreur` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div class="mt-3">
      <label for={p.id} class="font-bold">
        {p.label}
      </label>
      {p.aide && (
        <p id={`${p.id}-aide`} class="text-sm text-ink-soft">
          {p.aide}
        </p>
      )}
      {p.children({
        id: p.id,
        class: 'champ mt-1',
        'aria-invalid': p.erreur ? 'true' : undefined,
        'aria-describedby': decrit || undefined,
      })}
      {p.erreur && (
        <p
          key={p.cleErreur}
          id={`${p.id}-erreur`}
          class="admin-erreur mt-1 text-sm"
          role={p.alerte ? 'alert' : undefined}
        >
          {p.erreur}
        </p>
      )}
    </div>
  );
}

export default function BackOffice({ depot, previsualisation, outils, familles }: Props) {
  const [client, setClient] = useState<ClientGitHub | null>(null);
  const [jetonSaisi, setJetonSaisi] = useState('');
  const [expiration, setExpiration] = useState<Date | null>(null);
  const [reglesManquantes, setReglesManquantes] = useState<string[]>([]);
  const [shas, setShas] = useState<Record<string, string>>({});
  const [connexion, setConnexion] = useState<'repos' | 'en_cours'>('repos');
  const [erreurConnexion, setErreurConnexion] = useState('');
  const [depart, setDepart] = useState<Depart | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [saisies, setSaisies] = useState<
    Record<string, { url: string; reseau: string; actif: boolean }>
  >({});
  const [edition, setEdition] = useState<{ index: number | null; saisie: SaisieCampagne } | null>(
    null,
  );
  const [erreursCampagne, setErreursCampagne] = useState<Record<string, string>>({});
  const [publications, setPublications] = useState<Publication[]>([]);
  const [etats, setEtats] = useState<Record<number, EtatPublication>>({});
  const [annonce, setAnnonce] = useState('');
  const [erreurPublication, setErreurPublication] = useState('');
  const [avertir, setAvertir] = useState(false);
  const [essaisConnexion, setEssaisConnexion] = useState(0);
  const [occupe, setOccupe] = useState(false);
  const titreDonnees = useRef<HTMLHeadingElement>(null);
  const titreConnexion = useRef<HTMLHeadingElement>(null);
  const titrePubs = useRef<HTMLHeadingElement>(null);
  const titreCampagne = useRef<HTMLHeadingElement>(null);
  const titrePublication = useRef<HTMLHeadingElement>(null);
  const boutonNouvelle = useRef<HTMLButtonElement>(null);
  const preavis = useRef<HTMLDivElement>(null);
  const boutonRester = useRef<HTMLButtonElement>(null);
  /** Élément qui avait le focus quand le préavis est apparu (rendu après « Rester connecté »). */
  const avantPreavis = useRef<Element | null>(null);
  const resumeErreurs = useRef<HTMLDivElement>(null);
  /** Élément à focaliser après le prochain rendu (l'élément qui avait le focus a disparu). */
  const aFocaliser = useRef<{ current: HTMLElement | null } | (() => HTMLElement | null) | null>(
    null,
  );
  const aEteConnecte = useRef(false);
  const prolonger = useRef(() => {});
  const jour = jourParis();

  const focaliserApres = (cible: { current: HTMLElement | null } | (() => HTMLElement | null)) => {
    aFocaliser.current = cible;
  };

  const charger = async (c: ClientGitHub) => {
    const [aff, pub, images, ouvertes, manquantes] = await Promise.all([
      c.lireFichier(CHEMIN_AFFILIATION),
      c.lireFichier(CHEMIN_PUBLICITES),
      c.listerDossier(DOSSIER_IMAGES),
      c.publicationsOuvertes(),
      c.reglesManquantes(),
    ]);
    const d: Depart = {
      affiliation: affiliationSchema.parse(JSON.parse(aff.texte)),
      publicites: publicitesSchema.parse(JSON.parse(pub.texte)),
      imagesDepot: images,
    };
    setShas({ [CHEMIN_AFFILIATION]: aff.sha, [CHEMIN_PUBLICITES]: pub.sha });
    setReglesManquantes(manquantes);
    setDepart(d);
    setBrouillon({ affiliation: d.affiliation, publicites: d.publicites, images: new Map() });
    setSaisies(
      Object.fromEntries(
        outils.map((o) => {
          const l = d.affiliation.liens[o.slug];
          return [o.slug, { url: l?.url ?? '', reseau: l?.reseau ?? '', actif: l?.actif ?? false }];
        }),
      ),
    );
    setPublications(ouvertes);
    setEdition(null);
  };

  const seConnecter = async (jeton: string) => {
    setJetonSaisi('');
    setErreurConnexion('');
    setAnnonce('');
    setEssaisConnexion((n) => n + 1);
    if (!jeton.startsWith('github_pat_')) {
      setErreurConnexion('Jeton à portée fine attendu (il commence par github_pat_).');
      return;
    }
    setConnexion('en_cours');
    try {
      const c = clientGitHub(jeton, depot);
      const acces = await c.verifierAcces();
      await charger(c);
      setExpiration(acces.expiration);
      setClient(c);
      setAnnonce('Connecté. Données chargées depuis la branche principale.');
    } catch (e) {
      setErreurConnexion(messageErreur(e));
    } finally {
      setConnexion('repos');
    }
  };

  const seDeconnecter = (motif = 'Déconnecté. Le jeton a été effacé de la mémoire.') => {
    setClient(null);
    setDepart(null);
    setBrouillon(null);
    setPublications([]);
    setEtats({});
    setExpiration(null);
    setErreurPublication('');
    setAvertir(false);
    setAnnonce(motif);
  };

  /**
   * Erreur d'une action de publication : affichée et annoncée (role=alert).
   * Toute erreur d'authentification efface la session.
   */
  const signaler = (e: unknown) => {
    if (e instanceof ErreurGitHub && e.statut === 401) {
      seDeconnecter('Jeton refusé par GitHub : session effacée, reconnectez-vous.');
      return;
    }
    setErreurPublication(messageErreur(e));
  };

  /**
   * Demandes fusionnées ou fermées hors du flux normal (sur GitHub, ou réponse
   * de fusion perdue) : seules celles-ci quittent l'écran. Si l'une a été
   * fusionnée, les données sont rechargées ; sinon le brouillon est conservé.
   */
  const clore = (c: ClientGitHub, closes: { numero: number; fusionnee: boolean }[]) => {
    const numeros = new Set(closes.map((x) => x.numero));
    if (document.activeElement?.closest('[data-demande]')) focaliserApres(titrePublication);
    setPublications((avant) => avant.filter((x) => !numeros.has(x.numero)));
    setEtats((avant) =>
      Object.fromEntries(Object.entries(avant).filter(([n]) => !numeros.has(Number(n)))),
    );
    if (!closes.some((x) => x.fusionnee)) {
      setAnnonce('Demande fermée sur GitHub : votre brouillon est conservé.');
      return;
    }
    void charger(c)
      .then(() => setAnnonce('Demande déjà mise en ligne : données rechargées depuis le site.'))
      .catch((e: unknown) => {
        if (e instanceof ErreurGitHub && e.statut === 401) signaler(e);
        else
          setErreurPublication(
            'Demande mise en ligne, mais les données n’ont pas pu être rechargées : rechargez la page.',
          );
      });
  };

  // Focus : sur les données à la connexion, sur le titre « Connexion » après une déconnexion.
  // L'effet joue une image après le rendu : si l'éditeur a déjà posé le focus dans un
  // champ entre-temps, il le garde (le bouton de connexion disparu, il serait sur body).
  useEffect(() => {
    if (client) {
      aEteConnecte.current = true;
      const actif = document.activeElement;
      if (!actif || actif === document.body) titreDonnees.current?.focus();
    } else if (aEteConnecte.current) {
      titreConnexion.current?.focus();
    }
  }, [client]);

  useEffect(() => {
    const cible = aFocaliser.current;
    if (!cible) return;
    aFocaliser.current = null;
    (typeof cible === 'function' ? cible() : cible.current)?.focus();
  });

  // Le jeton quitte la mémoire en quittant la page et après 30 minutes
  // d'inactivité, avec un préavis de 2 minutes qui permet de prolonger.
  useEffect(() => {
    if (!client) return;
    let alerte: ReturnType<typeof setTimeout> | undefined;
    let fin: ReturnType<typeof setTimeout> | undefined;
    const relancer = (e?: Event) => {
      // Activité dans le préavis lui-même (focus posé sur « Rester connecté »,
      // Tab, clic) : le préavis reste affiché jusqu'au choix de l'utilisateur.
      if (e?.target instanceof Node && preavis.current?.contains(e.target)) return;
      clearTimeout(alerte);
      clearTimeout(fin);
      setAvertir(false);
      alerte = setTimeout(() => {
        avantPreavis.current = document.activeElement;
        setAvertir(true);
        focaliserApres(boutonRester);
      }, INACTIVITE_MAX - PREAVIS);
      fin = setTimeout(
        () => seDeconnecter('Session expirée après 30 minutes d’inactivité.'),
        INACTIVITE_MAX,
      );
    };
    prolonger.current = () => relancer();
    relancer();
    const quitter = () => seDeconnecter();
    // Gestes de l'utilisateur seulement : un défilement programmatique (focus,
    // ancre) n'est pas une activité, d'où « wheel » et non « scroll ».
    const activite = ['keydown', 'pointerdown', 'focusin', 'input', 'wheel'] as const;
    window.addEventListener('pagehide', quitter);
    for (const t of activite) window.addEventListener(t, relancer, { passive: true });
    return () => {
      clearTimeout(alerte);
      clearTimeout(fin);
      window.removeEventListener('pagehide', quitter);
      for (const t of activite) window.removeEventListener(t, relancer);
    };
  }, [client]);

  // Suivi des publications ouvertes : relecture toutes les 20 s tant que la CI tourne.
  useEffect(() => {
    if (!client || publications.length === 0) return;
    let actif = true;
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const suivre = async () => {
      const nouveaux: Record<number, EtatPublication> = {};
      let echec = false;
      for (const p of publications) {
        try {
          nouveaux[p.numero] = await client.etat(p, estCheminPublie);
        } catch (e) {
          if (e instanceof ErreurGitHub && e.statut === 401) {
            if (actif) signaler(e);
            return;
          }
          echec = true; // état indisponible : nouvel essai au prochain passage
        }
      }
      if (!actif) return;
      setEtats((avant) => ({ ...avant, ...nouveaux }));
      // Demandes fusionnées ou fermées sur GitHub, hors de ce back office.
      const closes = publications.flatMap((p) => {
        const e = nouveaux[p.numero];
        return e && !e.ouverte ? [{ numero: p.numero, fusionnee: e.fusionnee }] : [];
      });
      if (closes.length > 0) {
        clore(client, closes);
        return;
      }
      const enCours = Object.values(nouveaux).some(
        (e) => e.ouverte && (e.ci !== 'reussie' || e.blocages.length > 0) && e.ci !== 'echouee',
      );
      if (enCours || echec) minuterie = setTimeout(() => void suivre(), 20_000);
    };
    void suivre();
    return () => {
      actif = false;
      clearTimeout(minuterie);
    };
  }, [client, publications]);

  // Une seule région d'état, au même endroit dans les deux écrans : elle n'est
  // jamais recréée, et son contenu est donc annoncé à chaque changement.
  const statut = (
    <p role="status" class="sr-only">
      {annonce}
    </p>
  );

  if (!client || !depart || !brouillon) {
    return (
      <div>
        {statut}
        <section aria-labelledby="connexion-titre" class="prose-measure">
          <h2 id="connexion-titre" ref={titreConnexion} tabIndex={-1} class="text-2xl font-bold">
            Connexion
          </h2>
          {annonce && aEteConnecte.current && <p class="mt-2 font-bold">{annonce}</p>}
          <p class="mt-2">
            Le back office écrit dans le dépôt GitHub du site. Collez un jeton GitHub à portée fine,
            limité à ce dépôt : il ne sert qu’à joindre GitHub, ne reste qu’en mémoire et n’est
            jamais enregistré par le site. Votre gestionnaire de mots de passe peut le retenir.
          </p>
          <details class="mt-3">
            <summary class="font-bold">Créer le jeton (une fois, 2 minutes)</summary>
            <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>
                GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
              </li>
              <li>
                Resource owner : {depot.proprietaire}. Repository access :{' '}
                <em>Only select repositories</em> → {depot.nom}. Expiration : 30 jours conseillés,
                90 au plus.
              </li>
              <li>
                Permissions du dépôt : Contents (Read and write), Pull requests (Read and write),
                Actions (Read-only). Metadata (Read-only) est ajouté d’office.
              </li>
              <li>
                Rien d’autre (ni Workflows, ni Administration). Copiez le jeton et collez-le
                ci-dessous ; révoquez-le en cas de doute. Utilisez de préférence un profil de
                navigateur sans extensions.
              </li>
            </ol>
          </details>
          <form
            class="mt-4"
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              if (jetonSaisi.trim()) void seConnecter(jetonSaisi.trim());
            }}
          >
            <Champ
              id="compte"
              label="Identifiant"
              aide="Fixe : il permet à votre gestionnaire de mots de passe de retrouver le jeton."
            >
              {(a) => (
                <input
                  {...a}
                  type="text"
                  autocomplete="username"
                  readOnly
                  value="back-office-jeton"
                />
              )}
            </Champ>
            <Champ
              id="jeton"
              label="Jeton GitHub"
              erreur={erreurConnexion || undefined}
              alerte
              cleErreur={essaisConnexion}
            >
              {(a) => (
                <input
                  {...a}
                  type="password"
                  autocomplete="current-password"
                  spellcheck={false}
                  required
                  value={jetonSaisi}
                  onInput={(e) => setJetonSaisi((e.target as HTMLInputElement).value)}
                />
              )}
            </Champ>
            <button type="submit" class="btn-cta mt-4" disabled={connexion === 'en_cours'}>
              {connexion === 'en_cours' ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const enCoursDePublication = publications.length > 0;
  const affiliationValide = affiliationSchema.safeParse(brouillon.affiliation).success;
  const fichiers = fichiersAPublier(depart, brouillon, jour);
  const modifications = resumeModifications(depart, brouillon);

  const majLien = (slug: string, champ: 'url' | 'reseau' | 'actif', valeur: string | boolean) => {
    const saisie = { ...saisies[slug]!, [champ]: valeur };
    setSaisies({ ...saisies, [slug]: saisie });
    setBrouillon({
      ...brouillon,
      affiliation: appliquerLien(
        brouillon.affiliation,
        slug,
        saisie,
        jour,
        depart.affiliation.liens[slug],
      ),
    });
  };

  const erreursLien = (slug: string): Record<string, string> => {
    const l = brouillon.affiliation.liens[slug];
    if (!l) return {};
    const r = lienAffiliationSchema.safeParse(l);
    return r.success ? {} : erreursParChamp(r.error.issues);
  };

  const choisirImage = async (fichier: File | undefined) => {
    if (!edition) return;
    if (!fichier) {
      setEdition({ ...edition, saisie: { ...edition.saisie, imageNouvelle: null } });
      return;
    }
    const apercu = await new Promise<string>((ok, ko) => {
      const lecteur = new FileReader();
      lecteur.onload = () => ok(String(lecteur.result));
      lecteur.onerror = () => ko(lecteur.error);
      lecteur.readAsDataURL(fichier);
    });
    const dims = await new Promise<{ largeur: number; hauteur: number }>((ok) => {
      const img = new Image();
      img.onload = () => ok({ largeur: img.naturalWidth, hauteur: img.naturalHeight });
      img.onerror = () => ok({ largeur: 0, hauteur: 0 });
      img.src = apercu;
    });
    const octets = new Uint8Array(await fichier.arrayBuffer());
    const erreur = controleImage({
      type: fichier.type,
      taille: fichier.size,
      ...dims,
      entete: octets.subarray(0, 16),
    });
    if (erreur) {
      setErreursCampagne({ ...erreursCampagne, image: erreur });
      setEdition({ ...edition, saisie: { ...edition.saisie, imageNouvelle: null } });
      return;
    }
    setErreursCampagne(
      Object.fromEntries(Object.entries(erreursCampagne).filter(([champ]) => champ !== 'image')),
    );
    setEdition({
      ...edition,
      saisie: {
        ...edition.saisie,
        imageNouvelle: { octets, ext: IMAGE_TYPES[fichier.type]!, apercu },
      },
    });
  };

  const enregistrerCampagne = () => {
    if (!edition) return;
    const s = edition.saisie;
    const ext = s.imageNouvelle?.ext ?? s.imageExistante?.split('.').pop() ?? null;
    const fichierImage = ext ? `${s.id}.${ext}` : null;
    const candidate = {
      id: s.id.trim(),
      annonceur: s.annonceur,
      annonceur_legal: s.annonceur_legal,
      outil: s.outil,
      emplacement: s.emplacement,
      familles: s.emplacement === 'familles' ? s.familles : [],
      titre: s.titre,
      texte: s.texte,
      cta: s.cta,
      url: s.url.trim(),
      image: fichierImage ? { fichier: fichierImage, alt: s.imageAlt } : null,
      debut: s.debut,
      fin: s.fin,
      active: s.active,
    };
    // Une annonce qui mène chez un éditeur comparé doit le déclarer (mention au lecteur).
    const edite = outils.find((o) => memeEditeur(candidate.url, o.urlOfficielle));
    if (edite && candidate.outil !== edite.slug) {
      setErreursCampagne({
        outil: `Cette URL mène chez ${edite.nom} : choisissez « ${edite.nom} » comme logiciel comparé.`,
      });
      requestAnimationFrame(() => resumeErreurs.current?.focus());
      return;
    }
    const r = campagneSchema.safeParse(candidate);
    const campagnes = [...brouillon.publicites.campagnes];
    if (r.success) {
      if (edition.index === null) campagnes.push(r.data);
      else campagnes[edition.index] = r.data;
    }
    const liste = publicitesSchema.safeParse({ date_maj: jour, campagnes });
    if (!r.success || !liste.success) {
      setErreursCampagne(
        !r.success
          ? erreursParChamp(r.error.issues)
          : { _: liste.error!.issues.map((i) => i.message).join(' ; ') },
      );
      setAnnonce('La campagne contient des erreurs.');
      requestAnimationFrame(() => resumeErreurs.current?.focus());
      return;
    }
    const images = new Map(brouillon.images);
    if (s.imageNouvelle && fichierImage) images.set(fichierImage, s.imageNouvelle.octets);
    // Renommage (identifiant ou format changé) : l'image existante suit la campagne.
    if (!s.imageNouvelle && s.imageExistante && fichierImage && s.imageExistante !== fichierImage) {
      const octets = images.get(s.imageExistante);
      if (octets) images.set(fichierImage, octets);
      else {
        setErreursCampagne({
          image:
            'Pour changer l’identifiant d’une annonce illustrée, choisissez à nouveau l’image.',
        });
        requestAnimationFrame(() => resumeErreurs.current?.focus());
        return;
      }
    }
    setBrouillon({ ...brouillon, publicites: liste.data, images });
    setEdition(null);
    setErreursCampagne({});
    setAnnonce(`Campagne « ${candidate.id} » enregistrée dans le brouillon.`);
    focaliserApres(boutonNouvelle);
  };

  const supprimerCampagne = (index: number) => {
    const c = brouillon.publicites.campagnes[index]!;
    if (!window.confirm(`Supprimer la campagne « ${c.id} » du brouillon ?`)) return;
    const campagnes = brouillon.publicites.campagnes.filter((_, i) => i !== index);
    setBrouillon({ ...brouillon, publicites: { date_maj: jour, campagnes } });
    // La campagne en cours d'édition est désignée par son rang : il suit la suppression.
    if (edition?.index === index) {
      setEdition(null);
      setErreursCampagne({});
    } else if (edition && edition.index !== null && edition.index > index) {
      setEdition({ ...edition, index: edition.index - 1 });
    }
    setAnnonce(`Campagne « ${c.id} » retirée du brouillon.`);
    focaliserApres(titrePubs);
  };

  const publier = async () => {
    setOccupe(true);
    setErreurPublication('');
    try {
      // Sha des JSON tels que chargés : si main a changé depuis, la publication est refusée.
      const attendus = Object.fromEntries(
        fichiers.filter((x) => x.chemin in shas).map((x) => [x.chemin, shas[x.chemin]!]),
      );
      const p = await client.publier(
        fichiers,
        attendus,
        estCheminPublie,
        `Back office : ${modifications.length} modification${modifications.length > 1 ? 's' : ''} (${jour})`,
        [
          'Publication préparée dans le back office /admin.',
          '',
          ...modifications.map((m) => `- ${m}`),
          '',
          'La CI vérifie les données (schémas, liens, CSP, build) ; la mise en ligne se fait depuis /admin une fois la CI verte.',
        ].join('\n'),
        new Date(),
      );
      setPublications([p]);
      setAnnonce(`Demande de publication n° ${p.numero} créée. Vérifications lancées.`);
      focaliserApres(titrePublication);
    } catch (e) {
      signaler(e);
    } finally {
      setOccupe(false);
    }
  };

  const mettreEnLigne = async (p: Publication) => {
    setOccupe(true);
    setErreurPublication('');
    try {
      // Dernière lecture juste avant la fusion : rien ne doit avoir bougé.
      const etat = await client.etat(p, estCheminPublie);
      if (!etat.ouverte) {
        clore(client, [{ numero: p.numero, fusionnee: etat.fusionnee }]);
        setOccupe(false);
        return;
      }
      if (etat.blocages.length > 0) {
        setEtats((avant) => ({ ...avant, [p.numero]: etat }));
        setErreurPublication(`Mise en ligne refusée : ${etat.blocages.join(' ; ')}.`);
        setOccupe(false);
        return;
      }
      await client.mettreEnLigne(p);
    } catch (e) {
      signaler(e);
      setOccupe(false);
      return;
    }
    // La fusion est faite : la demande n'est plus ouverte, même si le rechargement échoue.
    setPublications((avant) => avant.filter((x) => x.numero !== p.numero));
    setEtats({});
    setAnnonce(
      `Publication n° ${p.numero} mise en ligne : Netlify déploie le site (quelques minutes).`,
    );
    focaliserApres(titrePublication);
    try {
      await charger(client);
    } catch (e) {
      if (e instanceof ErreurGitHub && e.statut === 401) signaler(e);
      else
        setErreurPublication(
          'Mise en ligne faite, mais les données n’ont pas pu être rechargées : rechargez la page.',
        );
    } finally {
      setOccupe(false);
    }
  };

  const abandonner = async (p: Publication) => {
    if (
      !window.confirm(
        `Abandonner la demande n° ${p.numero} ? Rien ne sera mis en ligne ; votre brouillon est conservé.`,
      )
    )
      return;
    setOccupe(true);
    setErreurPublication('');
    try {
      await client.abandonner(p);
      // Le brouillon reste tel quel pour être corrigé ; si le site a changé
      // entretemps, la prochaine publication le signalera (contrôle des sha).
      setPublications((avant) => avant.filter((x) => x.numero !== p.numero));
      setEtats({});
      setAnnonce(
        `Demande n° ${p.numero} abandonnée : votre brouillon est conservé, corrigez-le puis publiez à nouveau.`,
      );
      focaliserApres(titrePublication);
    } catch (e) {
      signaler(e);
    } finally {
      setOccupe(false);
    }
  };

  const s = edition?.saisie;
  const majSaisie = (champ: keyof SaisieCampagne, valeur: unknown) =>
    edition && setEdition({ ...edition, saisie: { ...edition.saisie, [champ]: valeur } });
  const valeur = (e: Event) => (e.target as HTMLInputElement).value;

  return (
    <div>
      {statut}
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 ref={titreDonnees} tabIndex={-1} class="text-2xl font-bold">
          Données du site
        </h2>
        <button type="button" class="btn-ghost" onClick={() => seDeconnecter()}>
          Se déconnecter
        </button>
      </div>
      {avertir && (
        <div
          ref={preavis}
          role="alert"
          class="admin-erreurs fixed inset-x-4 bottom-4 z-50 bg-paper p-3 shadow-lg"
        >
          <p>
            Sans activité, la session sera fermée dans 2 minutes et le brouillon non publié sera
            perdu.
          </p>
          <button
            type="button"
            ref={boutonRester}
            class="btn-cta mt-2"
            onClick={() => {
              prolonger.current();
              const avant = avantPreavis.current;
              focaliserApres(() =>
                avant instanceof HTMLElement && avant.isConnected && avant !== document.body
                  ? avant
                  : titreDonnees.current,
              );
            }}
          >
            Rester connecté
          </button>
        </div>
      )}
      {expiration && (
        <p class="mt-2 text-sm text-ink-soft">
          Jeton valable jusqu’au {expiration.toLocaleDateString('fr-FR')} : pensez à le renouveler.
        </p>
      )}
      <p class="mt-4 rounded-md border border-border p-3 text-sm">
        Le dépôt est public : tout ce que vous publiez ici (liens, annonces, dates, images) devient
        visible dès la demande de publication. N’y mettez jamais de tarif, de contrat ni de montant
        de commission.
      </p>
      {reglesManquantes.length > 0 && (
        <div role="alert" class="admin-erreurs mt-4 p-3">
          <p class="font-bold">Publication bloquée : la branche principale n’est pas protégée.</p>
          <p class="mt-1 text-sm">
            Règles manquantes : {reglesManquantes.join(', ')}. Créez-les dans GitHub (Settings →
            Rules → Rulesets, voir TODO.md), jamais avec ce jeton, puis rechargez la page.
          </p>
        </div>
      )}
      {enCoursDePublication && (
        <p class="en-bref mt-4">
          Une demande de publication est ouverte : mettez-la en ligne ou abandonnez-la (section
          Publication) avant d’en préparer une autre.
        </p>
      )}

      <fieldset disabled={enCoursDePublication || occupe} class="mt-6">
        <legend class="sr-only">Modifications</legend>

        <section aria-labelledby="liens-titre">
          <h3 id="liens-titre" class="titre-section text-xl font-bold">
            Liens d’affiliation
          </h3>
          <p class="mt-2 text-sm text-ink-soft">
            Un lien actif fait passer le bouton de l’outil par /go/… avec la mention « lien affilié
            ». Sans lien actif, le bouton mène au site officiel, sans mention. Aucun montant de
            commission n’est saisi ici : il n’entre jamais dans les classements.
          </p>
          {outils.map((o) => {
            const sa = saisies[o.slug]!;
            const err = erreursLien(o.slug);
            return (
              <fieldset class="mt-4 border-t border-border pt-4" key={o.slug}>
                <legend class="px-1 font-bold">{o.nom}</legend>
                <p class="text-sm text-ink-soft">Site officiel : {o.urlOfficielle}</p>
                <Champ
                  id={`url-${o.slug}`}
                  label="URL affiliée"
                  erreur={err['url']}
                  aide={sa.url && hote(sa.url) ? `Domaine de destination : ${hote(sa.url)}` : ''}
                >
                  {(a) => (
                    <input
                      {...a}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      value={sa.url}
                      onInput={(e) => majLien(o.slug, 'url', valeur(e))}
                    />
                  )}
                </Champ>
                <Champ
                  id={`reseau-${o.slug}`}
                  label="Réseau ou programme (publié sur la page transparence)"
                  erreur={err['reseau']}
                >
                  {(a) => (
                    <input
                      {...a}
                      type="text"
                      maxLength={60}
                      value={sa.reseau}
                      onInput={(e) => majLien(o.slug, 'reseau', valeur(e))}
                    />
                  )}
                </Champ>
                <label class="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sa.actif}
                    onChange={() => majLien(o.slug, 'actif', !sa.actif)}
                  />
                  <span>Lien actif</span>
                </label>
              </fieldset>
            );
          })}
        </section>

        <section aria-labelledby="pubs-titre" class="mt-10">
          <h3 id="pubs-titre" ref={titrePubs} tabIndex={-1} class="titre-section text-xl font-bold">
            Espaces publicitaires
          </h3>
          <p class="mt-2 text-sm text-ink-soft">
            Une annonce porte toujours la mention « Publicité » et le nom de l’annonceur. Elle n’est
            jamais affichée sur les fiches logiciel, les comparatifs, les outils ou la méthode, et
            n’influence aucun classement. Une seule campagne par emplacement à la fois ; les dates
            sont appliquées à la reconstruction quotidienne du site.
          </p>
          {brouillon.publicites.campagnes.length === 0 ? (
            <p class="mt-4">Aucune campagne.</p>
          ) : (
            <ul class="mt-4 space-y-3">
              {brouillon.publicites.campagnes.map((c, i) => (
                <li class="rounded-md border border-border p-3" key={c.id}>
                  <p class="font-bold">
                    {c.titre} <span class="font-normal text-ink-soft">({c.id})</span>
                  </p>
                  <p class="text-sm">
                    {c.annonceur} · {LIBELLES_EMPLACEMENT[c.emplacement]}
                    {c.familles.length > 0 &&
                      ` · ${c.familles.map((f) => familles.find((x) => x.slug === f)?.label ?? f).join(', ')}`}
                  </p>
                  <p class="text-sm">
                    Du {c.debut} au {c.fin} · <strong>{statutCampagne(c, jour)}</strong>
                  </p>
                  <p class="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="btn-ghost"
                      onClick={() => {
                        setErreursCampagne({});
                        setEdition({ index: i, saisie: versSaisie(c) });
                        focaliserApres(titreCampagne);
                      }}
                    >
                      Modifier<span class="sr-only"> la campagne {c.id}</span>
                    </button>
                    <button type="button" class="btn-ghost" onClick={() => supprimerCampagne(i)}>
                      Supprimer<span class="sr-only"> la campagne {c.id}</span>
                    </button>
                  </p>
                </li>
              ))}
            </ul>
          )}

          {!edition && (
            <button
              type="button"
              class="btn-ghost mt-4"
              ref={boutonNouvelle}
              onClick={() => {
                setErreursCampagne({});
                setEdition({ index: null, saisie: campagneVide(jour) });
                focaliserApres(titreCampagne);
              }}
            >
              Nouvelle campagne
            </button>
          )}

          {edition && s && (
            <form
              class="mt-6 rounded-md border border-border p-4"
              aria-labelledby="campagne-titre"
              onSubmit={(e) => {
                e.preventDefault();
                enregistrerCampagne();
              }}
            >
              <h4 id="campagne-titre" ref={titreCampagne} tabIndex={-1} class="text-lg font-bold">
                {edition.index === null ? 'Nouvelle campagne' : `Modifier « ${s.id} »`}
              </h4>
              {Object.keys(erreursCampagne).length > 0 && (
                <div ref={resumeErreurs} tabIndex={-1} role="alert" class="admin-erreurs mt-3 p-3">
                  <p class="font-bold">À corriger :</p>
                  <ul class="list-disc pl-5 text-sm">
                    {Object.entries(erreursCampagne).map(([champ, m]) => (
                      <li key={champ}>
                        {champ === '_' ? '' : `${LIBELLES_CHAMPS[champ] ?? champ} : `}
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Champ
                id="c-id"
                label="Identifiant"
                aide="Minuscules, chiffres et tirets, ex. annonceur-2026-11. Sert aussi au nom de l’image."
                erreur={erreursCampagne['id']}
              >
                {(a) => (
                  <input
                    {...a}
                    type="text"
                    required
                    value={s.id}
                    onInput={(e) => majSaisie('id', valeur(e))}
                  />
                )}
              </Champ>
              <Champ
                id="c-annonceur"
                label="Annonceur (affiché)"
                erreur={erreursCampagne['annonceur']}
              >
                {(a) => (
                  <input
                    {...a}
                    type="text"
                    required
                    maxLength={80}
                    value={s.annonceur}
                    onInput={(e) => majSaisie('annonceur', valeur(e))}
                  />
                )}
              </Champ>
              <Champ
                id="c-legal"
                label="Raison sociale et SIREN de l’annonceur"
                aide="Publiés sur la page transparence (LCEN, art. 20), ex. « Exemple SAS, SIREN 123 456 789 »."
                erreur={erreursCampagne['annonceur_legal']}
              >
                {(a) => (
                  <input
                    {...a}
                    type="text"
                    required
                    maxLength={120}
                    value={s.annonceur_legal}
                    onInput={(e) => majSaisie('annonceur_legal', valeur(e))}
                  />
                )}
              </Champ>
              <Champ
                id="c-outil"
                label="Logiciel comparé édité par l’annonceur"
                aide="Obligatoire si l’annonceur édite l’un des logiciels comparés : l’annonce le signale et reste limitée à l’accueil et aux guides."
                erreur={erreursCampagne['outil']}
              >
                {(a) => (
                  <select
                    {...a}
                    value={s.outil ?? ''}
                    onChange={(e) => majSaisie('outil', valeur(e) || null)}
                  >
                    <option value="">Aucun</option>
                    {outils.map((o) => (
                      <option value={o.slug} key={o.slug}>
                        {o.nom}
                      </option>
                    ))}
                  </select>
                )}
              </Champ>
              <Champ id="c-emplacement" label="Emplacement" erreur={erreursCampagne['emplacement']}>
                {(a) => (
                  <select
                    {...a}
                    value={s.emplacement}
                    onChange={(e) => majSaisie('emplacement', valeur(e))}
                  >
                    {EMPLACEMENTS_PUB.map((em) => (
                      <option value={em} key={em}>
                        {LIBELLES_EMPLACEMENT[em]}
                      </option>
                    ))}
                  </select>
                )}
              </Champ>
              {s.emplacement === 'familles' && (
                <fieldset class="mt-3">
                  <legend class="font-bold">Familles ciblées</legend>
                  <p class="text-sm text-ink-soft">Aucune case cochée : toutes les familles.</p>
                  <div class="mt-1 grid gap-1 sm:grid-cols-2">
                    {familles.map((f) => (
                      <label class="flex items-center gap-2" key={f.slug}>
                        <input
                          type="checkbox"
                          checked={s.familles.includes(f.slug as never)}
                          onChange={() =>
                            majSaisie(
                              'familles',
                              s.familles.includes(f.slug as never)
                                ? s.familles.filter((x) => x !== f.slug)
                                : [...s.familles, f.slug],
                            )
                          }
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <Champ
                id="c-titre"
                label="Titre (70 caractères au plus)"
                erreur={erreursCampagne['titre']}
              >
                {(a) => (
                  <input
                    {...a}
                    type="text"
                    required
                    maxLength={70}
                    value={s.titre}
                    onInput={(e) => majSaisie('titre', valeur(e))}
                  />
                )}
              </Champ>
              <Champ
                id="c-texte"
                label="Texte (160 caractères au plus)"
                erreur={erreursCampagne['texte']}
              >
                {(a) => (
                  <textarea
                    {...a}
                    required
                    maxLength={160}
                    rows={3}
                    value={s.texte}
                    onInput={(e) => majSaisie('texte', valeur(e))}
                  />
                )}
              </Champ>
              <Champ
                id="c-cta"
                label="Libellé du bouton"
                aide="Explicite, ex. « Voir l’offre de l’annonceur » (pas « En savoir plus »)."
                erreur={erreursCampagne['cta']}
              >
                {(a) => (
                  <input
                    {...a}
                    type="text"
                    required
                    maxLength={30}
                    value={s.cta}
                    onInput={(e) => majSaisie('cta', valeur(e))}
                  />
                )}
              </Champ>
              <Champ id="c-url" label="URL de destination (https)" erreur={erreursCampagne['url']}>
                {(a) => (
                  <input
                    {...a}
                    type="url"
                    required
                    value={s.url}
                    onInput={(e) => majSaisie('url', valeur(e))}
                  />
                )}
              </Champ>
              <div class="grid gap-3 sm:grid-cols-2">
                <Champ id="c-debut" label="Début" erreur={erreursCampagne['debut']}>
                  {(a) => (
                    <input
                      {...a}
                      type="date"
                      required
                      value={s.debut}
                      onInput={(e) => majSaisie('debut', valeur(e))}
                    />
                  )}
                </Champ>
                <Champ id="c-fin" label="Fin (incluse)" erreur={erreursCampagne['fin']}>
                  {(a) => (
                    <input
                      {...a}
                      type="date"
                      required
                      value={s.fin}
                      onInput={(e) => majSaisie('fin', valeur(e))}
                    />
                  )}
                </Champ>
              </div>
              <Champ
                id="c-image"
                label="Image (facultative)"
                aide={`WebP, PNG, JPEG ou AVIF, 300 Ko au plus, 640 × 360 px au moins.${s.imageExistante ? ` Image actuelle : ${s.imageExistante}.` : ''}`}
                erreur={erreursCampagne['image']}
              >
                {(a) => (
                  <input
                    {...a}
                    type="file"
                    accept={Object.keys(IMAGE_TYPES).join(',')}
                    onChange={(e) => void choisirImage((e.target as HTMLInputElement).files?.[0])}
                  />
                )}
              </Champ>
              {(s.imageNouvelle || s.imageExistante) && (
                <>
                  <Champ
                    id="c-alt"
                    label="Texte alternatif de l’image"
                    aide="Décrivez ce que montre l’image ; laissez vide si elle est purement décorative."
                    erreur={erreursCampagne['image.alt']}
                  >
                    {(a) => (
                      <input
                        {...a}
                        type="text"
                        maxLength={150}
                        value={s.imageAlt}
                        onInput={(e) => majSaisie('imageAlt', valeur(e))}
                      />
                    )}
                  </Champ>
                  <button
                    type="button"
                    class="btn-ghost mt-3"
                    onClick={() => {
                      if (!edition) return;
                      setEdition({
                        ...edition,
                        saisie: { ...s, imageNouvelle: null, imageExistante: null, imageAlt: '' },
                      });
                      focaliserApres(() => document.getElementById('c-image'));
                    }}
                  >
                    Retirer l’image
                  </button>
                </>
              )}
              <label class="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={() => majSaisie('active', !s.active)}
                />
                <span>Campagne active</span>
              </label>

              <p class="mt-4 font-bold">Aperçu</p>
              <div class="espace-pub mt-2">
                <p class="espace-pub-mention">
                  <span class="font-bold">Publicité</span> · Annonceur : {s.annonceur || '…'}
                </p>
                <div class="espace-pub-corps">
                  {s.imageNouvelle && (
                    <img src={s.imageNouvelle.apercu} alt={s.imageAlt} class="espace-pub-image" />
                  )}
                  <div>
                    <p class="text-lg font-bold">{s.titre || 'Titre'}</p>
                    <p class="mt-1 text-sm">{s.texte || 'Texte'}</p>
                    <p class="mt-3">
                      <span class="btn-ghost">{s.cta || 'Bouton'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <p class="mt-4 flex flex-wrap gap-2">
                <button type="submit" class="btn-cta">
                  Enregistrer dans le brouillon
                </button>
                <button
                  type="button"
                  class="btn-ghost"
                  onClick={() => {
                    setEdition(null);
                    setErreursCampagne({});
                    focaliserApres(boutonNouvelle);
                  }}
                >
                  Annuler
                </button>
              </p>
            </form>
          )}
        </section>
      </fieldset>

      <section aria-labelledby="publication-titre" class="mt-10">
        <h3
          id="publication-titre"
          ref={titrePublication}
          tabIndex={-1}
          class="titre-section text-xl font-bold"
        >
          Publication
        </h3>
        {erreurPublication && (
          <div role="alert" class="admin-erreurs mt-3 p-3">
            <p>{erreurPublication}</p>
          </div>
        )}
        {!enCoursDePublication && (
          <>
            {modifications.length === 0 ? (
              <p class="mt-2">Aucune modification à publier.</p>
            ) : (
              <>
                <p class="mt-2">Modifications prêtes :</p>
                <ul class="mt-1 list-disc pl-5">
                  {modifications.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
            <button
              type="button"
              class="btn-cta mt-4"
              disabled={
                fichiers.length === 0 ||
                reglesManquantes.length > 0 ||
                !affiliationValide ||
                occupe ||
                edition !== null
              }
              onClick={() => void publier()}
            >
              {occupe ? 'Envoi…' : 'Créer la demande de publication'}
            </button>
            {!affiliationValide && (
              <p class="admin-erreur mt-2 text-sm">
                Corrigez les liens en erreur avant de publier.
              </p>
            )}
            {edition !== null && (
              <p class="mt-2 text-sm text-ink-soft">
                Enregistrez ou annulez la campagne en cours d’édition avant de publier.
              </p>
            )}
          </>
        )}
        {publications.map((p) => {
          const e = etats[p.numero];
          const pret =
            e?.ouverte === true && e.blocages.length === 0 && reglesManquantes.length === 0;
          return (
            <div class="mt-4 border-t border-ink pt-4" key={p.numero} data-demande={p.numero}>
              <p class="font-bold">
                Demande n° {p.numero} : {p.titre}
              </p>
              <p class="mt-1 text-sm" aria-live="polite" aria-atomic="true">
                {e ? (
                  e.fusionnee ? (
                    'Déjà mise en ligne.'
                  ) : (
                    <>
                      État : {LIBELLES_CI[e.ci]}
                      {e.blocages.length > 0 && (
                        <span class="block text-ink-soft">
                          En attente : {e.blocages.join(' ; ')}.
                        </span>
                      )}
                    </>
                  )
                ) : (
                  'État en cours de lecture…'
                )}
              </p>
              <p class="mt-2 flex flex-wrap gap-3 text-sm">
                <a href={p.url} rel="noopener">
                  Voir la demande sur GitHub<span class="sr-only"> (demande n° {p.numero})</span>
                </a>
                <a href={previsualisation.replace('{n}', String(p.numero))} rel="noopener">
                  Prévisualiser le site modifié
                  <span class="sr-only"> par la demande n° {p.numero}</span>
                </a>
              </p>
              <p class="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-cta"
                  disabled={!pret || occupe}
                  onClick={() => void mettreEnLigne(p)}
                >
                  Mettre en ligne<span class="sr-only"> la demande n° {p.numero}</span>
                </button>
                <button
                  type="button"
                  class="btn-ghost"
                  disabled={occupe}
                  onClick={() => void abandonner(p)}
                >
                  Abandonner<span class="sr-only"> la demande n° {p.numero}</span>
                </button>
              </p>
              {e?.ci === 'echouee' && (
                <p class="admin-erreur mt-2 text-sm">
                  Les vérifications ont échoué : ouvrez la demande sur GitHub pour lire le motif,
                  puis abandonnez-la et corrigez le brouillon.
                </p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
