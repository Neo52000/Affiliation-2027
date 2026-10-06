import { z } from 'astro/zod';

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

export const affiliationSchema = z.object({
  date_maj: dateIso,
  note: z.string(),
  liens: z.record(z.string().regex(/^[a-z0-9-]+$/), url.nullable()),
});
