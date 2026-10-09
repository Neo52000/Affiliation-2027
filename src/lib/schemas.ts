import { z } from 'astro/zod';
import { chevauchements } from './publicites.ts';
import { estUrlSure, INVISIBLES, MESSAGE_URL_SURE } from './url-sure.ts';

// Zod sonde Function("") pour compiler ses validateurs ; la CSP du site interdit
// eval : le mode sans compilation évite cette sonde (et sa violation CSP dans /admin).
z.config({ jitless: true });

/**
 * Schémas de données (section 5 de la spécification).
 * Règle : tout prix et toute fonctionnalité portent une date de relevé et une
 * URL source ; donnée non vérifiée = null (jamais d'estimation).
 */

const dateIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date au format YYYY-MM-DD');
const url = z.url();

export const FAMILLES = [
  'batiment',
  'sante',
  'commerce',
  'services',
  'liberal',
  'artisanat',
  'numerique',
  'transport',
  'restauration',
  'agriculture',
] as const;

/** Note sur 10, ou null tant que statut_test = a_tester. */
const note = z.number().min(0).max(10).nullable();

export const outilSchema = z
  .object({
    nom: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    url_officielle: url,
    est_plateforme_agreee: z.object({
      valeur: z.boolean(),
      /** null tant que non confirmée sur la liste officielle (TODO.md #9) */
      date_immatriculation: dateIso.nullable(),
      source: url.nullable(),
    }),
    /** null = non vérifié sur le site officiel de l'éditeur (TODO.md #13) */
    offre_gratuite: z
      .object({
        valeur: z.boolean(),
        limites: z.string().nullable(),
      })
      .nullable(),
    plans: z.array(
      z.object({
        nom: z.string(),
        prix_ht_mensuel: z.number().nonnegative().nullable(),
        date_releve: dateIso.nullable(),
        url_source: url.nullable(),
      }),
    ),
    cible: z.array(z.string()),
    fonctionnalites: z.object({
      emission: z.boolean().nullable(),
      reception: z.boolean().nullable(),
      e_reporting: z.boolean().nullable(),
      compte_pro: z.boolean().nullable(),
      compta: z.boolean().nullable(),
      devis: z.boolean().nullable(),
      acomptes: z.boolean().nullable(),
      app_mobile: z.boolean().nullable(),
      export_comptable: z.boolean().nullable(),
      lien_expert_comptable: z.boolean().nullable(),
    }),
    /** Pondération publique (/methode) : conformité 25 %, prix 20 %, simplicité 20 %,
     * fonctionnalités métier 20 %, support 10 %, pérennité 5 %. */
    notes: z.object({
      conformite: note,
      prix: note,
      simplicite: note,
      fonctionnalites_metier: note,
      support: note,
      perennite: note,
      finale: note,
    }),
    points_forts: z.array(z.string()),
    points_faibles: z.array(z.string()),
    statut_test: z.enum(['a_tester', 'teste']),
    date_maj: dateIso,
    sources: z.array(z.object({ objet: z.string(), url, date_releve: dateIso })),
  })
  .refine((o) => o.statut_test !== 'a_tester' || o.notes.finale === null, {
    message: 'La note finale reste null tant que statut_test = a_tester',
  });

export const metierSchema = z.object({
  nom: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  famille: z.enum(FAMILLES),
  statuts_frequents: z.array(z.string()).min(1),
  volume_factures_typique: z.string(),
  clients_types: z.enum(['B2B', 'B2C', 'mixte']),
  specificites_facturation: z.array(z.string()).min(1),
  mentions_obligatoires_specifiques: z.array(z.string()),
  exemple_facture: z.object({
    intitule: z.string(),
    lignes: z
      .array(
        z.object({
          designation: z.string(),
          quantite: z.number().positive(),
          unite: z.string(),
          /** Négatif pour une ligne de déduction (acompte déjà facturé) ;
           *  null quand le montant relève d'un tarif réglementé non reproduit ici. */
          prix_unitaire_ht: z.number().nullable(),
          /** null = hors champ de la TVA (franchise en base, débours) : aucun taux
           *  ne doit alors figurer sur la facture. */
          tva_pct: z.number().min(0).max(25).nullable(),
        }),
      )
      .min(1),
    mentions_specifiques: z.array(z.string()),
  }),
  besoins_prioritaires: z.array(z.string()).min(1),
  outils_recommandes: z
    .array(z.object({ slug: z.string(), justification: z.string().min(20) }))
    .min(1)
    .max(3),
  faq: z.array(z.object({ question: z.string(), reponse: z.string() })).length(5),
  sources: z.array(z.object({ titre: z.string(), url })).min(1),
  date_maj: dateIso,
});

export const ficheTestSchema = z
  .object({
    outil_slug: z.string().regex(/^[a-z0-9-]+$/),
    statut: z.enum(['a_tester', 'teste']),
    date_test: dateIso.nullable(),
    testeur: z.string().nullable(),
    protocole: z.array(z.string()).min(1),
    /** Rempli uniquement par l'éditeur humain après test réel — jamais généré. */
    resultats: z
      .object({
        duree_premiere_facture_min: z.number().nullable(),
        observations: z.array(z.string()),
      })
      .nullable(),
  })
  .refine((t) => t.statut !== 'a_tester' || (t.resultats === null && t.date_test === null), {
    message: 'Une fiche a_tester ne porte ni résultats ni date de test',
  })
  .refine((t) => t.statut !== 'teste' || t.date_test !== null, {
    message: 'Une fiche teste porte sa date de test',
  });

export const guideSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date_maj: dateIso,
  sources: z.array(z.object({ titre: z.string(), url })).min(1),
});

export const echeancesSchema = z.object({
  date_releve: dateIso,
  methode: z.string(),
  echeances: z
    .array(
      z.object({
        id: z.string(),
        date: dateIso,
        obligation: z.string(),
        concernes: z.string(),
        statut: z.enum(['en_vigueur', 'a_venir']),
        complement: z.string().nullable(),
        sources: z.array(url).min(1),
      }),
    )
    .min(1),
  base_legale: z.array(z.object({ texte: z.string(), url })).min(1),
  tolerance_2026: z.object({ texte: z.string(), source: url }),
});

export const plateformesAgreeesSchema = z.object({
  provenance: z.object({
    source_officielle: url,
    copie_consultee: url,
    date_registre: dateIso,
    date_releve: dateIso,
    avertissement: z.string(),
  }),
  plateformes: z
    .array(
      z.object({
        nom: z.string().min(1),
        statut: z.enum(['immatriculation_definitive', 'dossier_en_attente']),
        date_immatriculation: dateIso.nullable(),
        localisation: z.string(),
        site: z.string(),
      }),
    )
    .min(1),
});

const slug = z.string().regex(/^[a-z0-9-]+$/);
/** URL saisie au back office : https, sans caractère capable de casser _redirects ou un href. */
const urlSure = z.string().refine(estUrlSure, MESSAGE_URL_SURE);
/** Texte saisi au back office : sans caractère de contrôle ni invisible (inversion bidi, etc.). */
const texteSur = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((t) => !INVISIBLES.test(t), 'caractère de contrôle ou invisible interdit');

/**
 * Lien affilié d'un outil, édité dans le back office (/admin). Aucun champ de
 * commission : le schéma strict refuse toute clé inconnue, pour qu'aucun
 * montant ne puisse entrer dans les données du site.
 */
export const lienAffiliationSchema = z
  .strictObject({
    /** URL fournie par le programme d'affiliation ; null = aucun partenariat. */
    url: urlSure.nullable(),
    /** Réseau ou programme (ex. « Affilae », « programme direct ») : mémo pour l'éditeur. */
    reseau: texteSur(1, 60).nullable(),
    /** false = lien conservé mais suspendu : le bouton revient à l'URL officielle. */
    actif: z.boolean(),
    maj: dateIso,
  })
  .refine((l) => !l.actif || l.url !== null, {
    message: 'un lien actif exige une URL',
    path: ['url'],
  });

export const affiliationSchema = z.strictObject({
  date_maj: dateIso,
  liens: z.record(slug, lienAffiliationSchema),
});

export type Affiliation = z.infer<typeof affiliationSchema>;

/**
 * Emplacements publicitaires, toujours en fin de page et hors des blocs de
 * classement ou de recommandation : accueil (après l'appel final), guides (après
 * « À lire ensuite »), pages famille /metiers/… (en fin de page). Jamais sur les
 * fiches métier, fiches logiciel, comparatifs, outils, méthode ou transparence.
 */
export const EMPLACEMENTS_PUB = ['accueil', 'guides', 'familles'] as const;

/** Formulations qui feraient passer une annonce pour un avis ou un classement du site. */
export const TEXTE_PUB_INTERDIT =
  /recommand|classement|class[ée]|comparatif|compar[ée]|n°\s*1|num[ée]ro\s*(1|un)\b|meilleur|[ée]lu\b|not[ée]\b|\bavis\b|plateforme agr[ée][ée]e/i;

/** Libellés de bouton que Lighthouse juge non descriptifs (audit « link-text »). */
const CTA_GENERIQUES = new Set([
  'ici',
  'cliquez ici',
  'en savoir plus',
  'lire la suite',
  'plus',
  'suite',
  'voir',
  'continuer',
]);

const textePub = (min: number, max: number) =>
  texteSur(min, max).refine(
    (t) => !TEXTE_PUB_INTERDIT.test(t),
    'formulation réservée au contenu éditorial (recommandation, classement, note, avis, agrément)',
  );

export const campagneSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9-]{3,60}$/, 'identifiant : 3 à 60 caractères a-z, 0-9, tiret'),
    /** Nom commercial affiché sur l'annonce. */
    annonceur: texteSur(2, 80),
    /**
     * Personne pour le compte de laquelle la publicité est faite (LCEN, art. 20) :
     * raison sociale et SIREN, publiés sur /transparence.
     */
    annonceur_legal: texteSur(2, 120),
    /** Slug d'un logiciel comparé quand l'annonceur l'édite ; null sinon. */
    outil: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .nullable(),
    emplacement: z.enum(EMPLACEMENTS_PUB),
    /** Ciblage des pages famille ; vide = toutes les familles. */
    familles: z.array(z.enum(FAMILLES)).max(FAMILLES.length),
    titre: textePub(5, 70),
    texte: textePub(10, 160),
    cta: textePub(2, 30).refine(
      (c) => !CTA_GENERIQUES.has(c.toLowerCase()),
      'libellé de bouton trop vague',
    ),
    url: urlSure,
    image: z
      .strictObject({
        fichier: z.string().regex(/^[a-z0-9-]{1,80}\.(webp|png|jpe?g|avif)$/),
        /** Texte alternatif ; vide si l'image est décorative (le texte de l'annonce suffit). */
        alt: z
          .string()
          .trim()
          .max(150)
          .refine((t) => !INVISIBLES.test(t), 'caractère invisible'),
      })
      .nullable(),
    debut: dateIso,
    fin: dateIso,
    active: z.boolean(),
  })
  .refine((c) => c.debut <= c.fin, { message: 'la fin précède le début', path: ['fin'] })
  .refine((c) => c.emplacement === 'familles' || c.familles.length === 0, {
    message: 'le ciblage par famille ne vaut que pour les pages famille',
    path: ['familles'],
  })
  // Un éditeur comparé n'achète jamais d'espace à côté des outils retenus d'une famille.
  .refine((c) => c.outil === null || c.emplacement !== 'familles', {
    message: 'un éditeur comparé ne peut annoncer que sur l’accueil ou les guides',
    path: ['emplacement'],
  });

export type Campagne = z.infer<typeof campagneSchema>;

export const publicitesSchema = z
  .strictObject({
    date_maj: dateIso,
    campagnes: z.array(campagneSchema),
  })
  .superRefine((d, ctx) => {
    const ids = new Set<string>();
    d.campagnes.forEach((c, i) => {
      if (ids.has(c.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `identifiant en double : ${c.id}`,
          path: ['campagnes', i, 'id'],
        });
      }
      ids.add(c.id);
    });
    for (const [a, b] of chevauchements(d.campagnes)) {
      ctx.addIssue({
        code: 'custom',
        message: `« ${a.id} » et « ${b.id} » occupent le même emplacement aux mêmes dates`,
        path: ['campagnes'],
      });
    }
  });

export type Publicites = z.infer<typeof publicitesSchema>;

/**
 * Points de facturation communs à une famille de métiers (hubs). Chaque point
 * généralise ce que disent déjà au moins deux fiches métier de la famille, et
 * cite une source officielle que ces fiches citent déjà.
 */
export const pointFamilleSchema = z.object({
  titre: z.string().min(1).max(70),
  texte: z.string().min(1).max(280),
  metiers_concernes: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(2),
  sources: z.array(z.object({ titre: z.string().min(1), url })).min(1),
});

export const pointsFamillesSchema = z.object({
  date_releve: dateIso,
  methode: z.string().min(1),
  /** Seules les familles dont les 4 points ont passé la vérification sont publiées. */
  familles: z.partialRecord(z.enum(FAMILLES), z.array(pointFamilleSchema).length(4)),
});
