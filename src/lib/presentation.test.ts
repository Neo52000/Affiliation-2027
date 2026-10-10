import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EXTRAITS_METIERS,
  cleSourceGouv,
  compterSourcesGouv,
  echapperHtml,
  espacesFautives,
  extraireTaux,
  extraireUrls,
  hotesGouv,
  insecables,
  de,
  insererBloc,
  remplirGabarit,
  valeurConfiguree,
  verifierExtrait,
} from './presentation';
import { metierSchema } from './schemas';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const lire = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('cleSourceGouv', () => {
  it('fusionne www, slash final et fragment', () => {
    expect(cleSourceGouv('https://www.impots.gouv.fr/professionnel/x/')).toBe(
      cleSourceGouv('https://impots.gouv.fr/professionnel/x#ancre'),
    );
  });

  it('fusionne les versions datées d’un article Légifrance', () => {
    expect(
      cleSourceGouv(
        'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006309516/2024-01-01',
      ),
    ).toBe(cleSourceGouv('https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006309516'));
  });

  it('identifie un document BOFiP par son numéro permanent, quels que soient date et BOI', () => {
    const attendu = 'bofip.impots.gouv.fr/1013-PGP';
    expect(
      cleSourceGouv(
        'https://bofip.impots.gouv.fr/bofip/1013-PGP.html/identifiant=BOI-TVA-LIQ-30-20-100-20230823',
      ),
    ).toBe(attendu);
    expect(
      cleSourceGouv(
        'https://bofip.impots.gouv.fr/bofip/1013-PGP.html?identifiant=BOI-TVA-LIQ-30-20-100',
      ),
    ).toBe(attendu);
    expect(
      cleSourceGouv('https://bofip.impots.gouv.fr/bofip/12016-PGP.html/identifiant=BOI-RES-000056'),
    ).toBe(
      cleSourceGouv(
        'https://bofip.impots.gouv.fr/bofip/12016-PGP.html/identifiant=BOI-RES-TVA-000056',
      ),
    );
  });

  it('identifie un texte Légifrance par son dernier identifiant, quel que soit le chemin', () => {
    expect(cleSourceGouv('https://www.legifrance.gouv.fr/loda/id/JORFTEXT000033935513')).toBe(
      cleSourceGouv('https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033935513/'),
    );
    expect(
      cleSourceGouv(
        'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069577/LEGISCTA000006163056/',
      ),
    ).toBe(cleSourceGouv('https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006163056'));
  });

  it('conserve une requête qui désigne une page', () => {
    expect(cleSourceGouv('https://mesdemarches.agriculture.gouv.fr/a?id_rubrique=76')).toBe(
      'mesdemarches.agriculture.gouv.fr/a?id_rubrique=76',
    );
  });

  it('exclut data.gouv.fr (copie tierce) et les domaines hors .gouv.fr', () => {
    expect(cleSourceGouv('https://www.data.gouv.fr/fr/datasets/x/')).toBeNull();
    expect(cleSourceGouv('https://www.service-public.fr/x')).toBeNull();
    expect(cleSourceGouv('pas une url')).toBeNull();
  });
});

describe('extraireUrls et compterSourcesGouv', () => {
  it('ne capture ni la parenthèse d’un lien MDX ni la ponctuation finale', () => {
    expect(
      extraireUrls('[texte](https://www.impots.gouv.fr/a). Voir https://economie.gouv.fr/b.'),
    ).toEqual(['https://www.impots.gouv.fr/a', 'https://economie.gouv.fr/b']);
  });

  it('compte une seule fois un même document cité sous deux formes', () => {
    expect(
      compterSourcesGouv([
        '"https://www.impots.gouv.fr/a/"',
        '[x](https://impots.gouv.fr/a) et https://www.data.gouv.fr/d',
      ]),
    ).toBe(1);
  });

  it('liste les hôtes .gouv.fr sans doublon ni « www. »', () => {
    expect(
      hotesGouv([
        'https://www.impots.gouv.fr/a',
        'https://impots.gouv.fr/b',
        'https://www.service-public.fr/c',
        'https://www.legifrance.gouv.fr/d',
      ]),
    ).toEqual(['impots.gouv.fr', 'legifrance.gouv.fr']);
  });
});

describe('verifierExtrait', () => {
  const source =
    'Gérer plusieurs taux de TVA (20 %, 10 %, 5,5 %) sur une même facture, ligne par ligne.';

  it('accepte un extrait fidèle qui omet une parenthèse', () => {
    expect(verifierExtrait(source, 'Plusieurs taux de TVA sur une même facture')).toBe(true);
  });

  it('refuse un extrait qui recompose des mots éloignés ou absents', () => {
    expect(verifierExtrait(source, 'Plusieurs factures')).toBe(false);
    expect(verifierExtrait(source, 'Un seul taux de TVA')).toBe(false);
  });
});

describe('extraits affichés dans la présentation', () => {
  for (const x of EXTRAITS_METIERS) {
    it(`« ${x.extrait} » est fidèle à ${x.slug}.besoins_prioritaires[${x.index}]`, () => {
      const metier = metierSchema.parse(JSON.parse(lire(`src/content/metiers/${x.slug}.json`)));
      const source = metier.besoins_prioritaires[x.index];
      expect(source, 'champ source absent').toBeDefined();
      expect(verifierExtrait(source ?? '', x.extrait)).toBe(true);
    });
  }

  it('les taux affichés pour le plombier viennent de sa fiche', () => {
    const metier = metierSchema.parse(JSON.parse(lire('src/content/metiers/plombier.json')));
    expect(extraireTaux(metier.besoins_prioritaires[0] ?? '')).toEqual([
      '20\u00a0%',
      '10\u00a0%',
      '5,5\u00a0%',
    ]);
  });
});

describe('gabarit de la présentation', () => {
  const gabarit = lire('presentation/pitch.template.html');

  it('ne contient aucune année en dur : les dates viennent de echeances.json', () => {
    expect(gabarit).not.toMatch(/\b20\d\d\b/);
  });

  it('ne contient aucun placeholder de configuration', () => {
    expect(gabarit).not.toMatch(/TODO_/);
  });
});

describe('remplissage', () => {
  it('remplit les clés et refuse une clé manquante', () => {
    expect(remplirGabarit('<p>{{ a }}</p>', { a: 'x' })).toBe('<p>x</p>');
    expect(() => remplirGabarit('<p>{{b}}</p>', {})).toThrow(/b/);
  });

  it('insère un bloc littéralement, marqueur unique exigé', () => {
    expect(insererBloc('a<!-- @X -->b', 'X', '$&$1')).toBe('a$&$1b');
    expect(() => insererBloc('a', 'X', 'y')).toThrow(/0 fois/);
  });

  it('échappe le HTML et pose les espaces insécables français', () => {
    expect(echapperHtml('<a href="x">l’été & co</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;l’été &amp; co&lt;/a&gt;',
    );
    expect(insecables('« 5,5 % : oui ! »')).toBe('«\u00a05,5\u00a0%\u00a0: oui\u00a0!\u00a0»');
    expect(insecables('relevé du 4 octobre 2026')).toBe('relevé du 4\u00a0octobre 2026');
    expect(insecables('le 1er septembre 2027')).toBe('le 1er\u00a0septembre 2027');
  });

  it('repère les espaces ordinaires qui couperaient une ponctuation française', () => {
    expect(espacesFautives('Sources : x')).toHaveLength(1);
    expect(espacesFautives('signalé « lien »')).toHaveLength(2);
    expect(espacesFautives('Sources\u00a0: «\u00a0x\u00a0»')).toEqual([]);
  });

  it('écarte les valeurs de configuration non renseignées', () => {
    expect(valeurConfiguree('TODO_EMAIL_CONTACT')).toBeNull();
    expect(valeurConfiguree('https://todo-domaine.example')).toBeNull();
    expect(valeurConfiguree('contact@exemple.fr')).toBe('contact@exemple.fr');
  });
});

describe('de', () => {
  it('élide devant une voyelle, pas devant une consonne', () => {
    expect(de('Abby')).toBe('d’Abby');
    expect(de('Indy')).toBe('d’Indy');
    expect(de('Tiime')).toBe('de Tiime');
    expect(de('Qonto')).toBe('de Qonto');
    expect(de('Épicerie fine')).toBe('d’Épicerie fine');
  });
});
