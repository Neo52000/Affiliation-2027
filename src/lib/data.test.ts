import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  affiliationSchema,
  echeancesSchema,
  ficheTestSchema,
  outilSchema,
  plateformesAgreeesSchema,
  publicitesSchema,
} from './schemas';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as unknown;

describe('src/data/echeances.json', () => {
  const data = echeancesSchema.parse(readJson('src/data/echeances.json'));

  it('chaque échéance porte au moins une source officielle en .gouv.fr', () => {
    for (const e of data.echeances) {
      expect(
        e.sources.some((s) => new URL(s).hostname.endsWith('.gouv.fr')),
        `échéance ${e.id} sans source .gouv.fr`,
      ).toBe(true);
    }
  });

  it('couvre les deux dates clés de la réforme', () => {
    const dates = new Set(data.echeances.map((e) => e.date));
    expect(dates).toContain('2026-09-01');
    expect(dates).toContain('2027-09-01');
  });
});

describe('src/data/plateformes-agreees.json', () => {
  const data = plateformesAgreeesSchema.parse(readJson('src/data/plateformes-agreees.json'));

  it('contient le registre complet (165 entrées : 149 définitives + 16 en attente)', () => {
    expect(data.plateformes).toHaveLength(165);
    expect(data.plateformes.filter((p) => p.statut === 'immatriculation_definitive')).toHaveLength(
      149,
    );
    expect(data.plateformes.filter((p) => p.statut === 'dossier_en_attente')).toHaveLength(16);
  });

  it('une entrée en attente ne porte jamais de date d’immatriculation', () => {
    for (const p of data.plateformes) {
      if (p.statut === 'dossier_en_attente') expect(p.date_immatriculation).toBeNull();
    }
  });

  it('référence les 6 outils du lancement', () => {
    const noms = data.plateformes.map((p) => p.nom.toLowerCase());
    for (const attendu of ['tiime', 'qonto', 'pennylane', 'abby', 'indy', 'shine']) {
      expect(
        noms.some((n) => n.includes(attendu)),
        `${attendu} absent du registre`,
      ).toBe(true);
    }
  });
});

describe('src/data/affiliation.json', () => {
  const data = affiliationSchema.parse(readJson('src/data/affiliation.json'));

  it('couvre les 6 outils du lancement', () => {
    expect(Object.keys(data.liens).sort()).toEqual([
      'abby',
      'indy',
      'pennylane',
      'qonto',
      'shine',
      'tiime',
    ]);
  });
});

describe('src/data/publicites.json', () => {
  const data = publicitesSchema.parse(readJson('src/data/publicites.json'));

  it('chaque image d’annonce existe dans src/assets/publicites et pèse 300 Ko au plus', () => {
    for (const c of data.campagnes) {
      if (!c.image) continue;
      const chemin = join(ROOT, 'src/assets/publicites', c.image.fichier);
      expect(existsSync(chemin), `${c.id} : image ${c.image.fichier} absente`).toBe(true);
      expect(statSync(chemin).size, `${c.id} : image trop lourde`).toBeLessThanOrEqual(300 * 1024);
    }
  });
});

describe('publicités : annonceurs et pages autorisées', () => {
  const data = publicitesSchema.parse(readJson('src/data/publicites.json'));
  const outils = readdirSync(join(ROOT, 'src/content/outils'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => outilSchema.parse(readJson(`src/content/outils/${f}`)));
  const hote = (u: string) => new URL(u).hostname.replace(/^www\./, '');

  it('une annonce vers le site d’un logiciel comparé déclare cet outil', () => {
    for (const c of data.campagnes) {
      const edite = outils.find((o) => hote(o.url_officielle) === hote(c.url));
      if (edite) expect(c.outil, `${c.id} mène chez ${edite.nom}`).toBe(edite.slug);
      if (c.outil) expect(outils.map((o) => o.slug)).toContain(c.outil);
    }
  });

  it('le composant d’annonce n’est inséré que sur l’accueil, les guides et les pages famille', () => {
    const pages = readdirSync(join(ROOT, 'src/pages'), { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.astro'));
    const avecPub = pages
      .filter((f) =>
        readFileSync(join(ROOT, 'src/pages', f), 'utf8').includes('EspacePublicitaire'),
      )
      .sort();
    expect(avecPub).toEqual(['guides/[slug].astro', 'index.astro', 'metiers/[famille].astro']);
  });
});

describe('indépendance du classement', () => {
  // Règle du site : ni les commissions ni la publicité n'entrent dans les notes,
  // l'ordre ou les recommandations. Les modules qui classent n'importent donc
  // jamais les données d'affiliation ni celles des annonces.
  const CLASSEMENT = ['quiz.ts', 'hub.ts', 'comparatifs.ts', 'familles.ts', 'facture-check.ts'];

  it.each(CLASSEMENT)('%s n’importe ni affiliation ni publicités', (fichier) => {
    const source = readFileSync(join(ROOT, 'src/lib', fichier), 'utf8');
    expect(source).not.toMatch(/affiliation|affiliate|liens-affilies|publicites/);
  });
});

describe('src/content/outils + src/content/tests', () => {
  const outilsDir = join(ROOT, 'src/content/outils');
  const outils = readdirSync(outilsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: f, data: outilSchema.parse(readJson(`src/content/outils/${f}`)) }));

  it('les 6 fiches outil valident le schéma et portent le slug de leur fichier', () => {
    expect(outils).toHaveLength(6);
    for (const { file, data } of outils) {
      expect(`${data.slug}.json`).toBe(file);
    }
  });

  it('aucune note tant que statut_test = a_tester (règle /methode)', () => {
    for (const { data } of outils) {
      if (data.statut_test === 'a_tester') {
        expect(Object.values(data.notes).every((n) => n === null)).toBe(true);
      }
    }
  });

  it('tout plan renseigné porte un prix OU un prix null, mais toujours date et URL si prix non null', () => {
    for (const { data } of outils) {
      for (const plan of data.plans) {
        if (plan.prix_ht_mensuel !== null) {
          expect(
            plan.date_releve,
            `${data.slug}/${plan.nom} : prix sans date de relevé`,
          ).not.toBeNull();
          expect(plan.url_source, `${data.slug}/${plan.nom} : prix sans URL source`).not.toBeNull();
        }
      }
    }
  });

  it('chaque fiche outil a une fiche de test associée', () => {
    const testsDir = join(ROOT, 'src/content/tests');
    const tests = readdirSync(testsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ficheTestSchema.parse(readJson(`src/content/tests/${f}`)));
    const slugsTestes = new Set(tests.map((t) => t.outil_slug));
    for (const { data } of outils) {
      expect(slugsTestes.has(data.slug), `pas de fiche de test pour ${data.slug}`).toBe(true);
    }
  });

  it('le statut du test est le même sur la fiche outil et sur la fiche de test', () => {
    // La pastille lit la fiche outil, la frise du protocole la fiche de test :
    // une mise à jour faite d'un seul côté afficherait deux états contradictoires.
    const testsDir = join(ROOT, 'src/content/tests');
    const tests = readdirSync(testsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ficheTestSchema.parse(readJson(`src/content/tests/${f}`)));
    for (const { data } of outils) {
      const t = tests.find((x) => x.outil_slug === data.slug);
      expect(t?.statut, `${data.slug} : statut_test et fiche de test divergent`).toBe(
        data.statut_test,
      );
    }
  });
});

describe('src/content/metiers : facture d’acompte', () => {
  // BOI-TVA-DECLA-30-20-10-10 : une facture d'acompte n'est obligatoire que pour une
  // opération elle-même soumise à facturation (client assujetti ou personne morale).
  // Une fiche dont la clientèle compte des particuliers ne peut donc pas l'imposer
  // pour « tout acompte » sans cette réserve (erreur corrigée sur 5 fiches).
  const OBLIGATION =
    /(tout (versement d['’])?acompte|chaque acompte)[^.]*(donne lieu|doit donner lieu|doit faire l['’]objet|doivent chacun faire l['’]objet)[^.]*facture/i;
  const RESERVE = /professionnel|personne morale|assujetti/i;
  const textes = (o: unknown): string[] =>
    typeof o === 'string'
      ? [o]
      : Array.isArray(o)
        ? o.flatMap(textes)
        : o && typeof o === 'object'
          ? Object.values(o).flatMap(textes)
          : [];

  it('aucune obligation générale de facturer un acompte quand la clientèle compte des particuliers', () => {
    const dir = join(ROOT, 'src/content/metiers');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const m = readJson(`src/content/metiers/${f}`) as {
        clients_types: string;
        specificites_facturation: string[];
        mentions_obligatoires_specifiques: string[];
        faq: unknown[];
        besoins_prioritaires: string[];
      };
      if (m.clients_types === 'B2B') continue;
      const champs = textes([
        m.specificites_facturation,
        m.mentions_obligatoires_specifiques,
        m.faq,
        m.besoins_prioritaires,
      ]);
      for (const t of champs.flatMap((x) => x.split(/(?<=[.!?])\s+/))) {
        if (OBLIGATION.test(t)) expect(t, `${f} : ${t}`).toMatch(RESERVE);
      }
    }
  });
});
