import { describe, expect, it } from 'vitest';
import {
  appliquerLien,
  controleImage,
  estCheminPublie,
  typeSelonSignature,
  fichiersAPublier,
  resumeModifications,
  statutCampagne,
  type Depart,
} from './admin-modele';
import type { Campagne } from './schemas';

const campagne = (p: Partial<Campagne> = {}): Campagne => ({
  id: 'exemple',
  annonceur: 'Exemple',
  annonceur_legal: 'Exemple SAS, SIREN 123 456 789',
  outil: null,
  emplacement: 'accueil',
  familles: [],
  titre: 'Un titre',
  texte: 'Un texte d’annonce',
  cta: 'Voir l’offre',
  url: 'https://exemple.fr/',
  image: null,
  debut: '2026-11-01',
  fin: '2026-11-30',
  active: true,
  ...p,
});

const depart: Depart = {
  affiliation: {
    date_maj: '2026-10-09',
    liens: { tiime: { url: null, reseau: null, actif: false, maj: '2026-10-09' } },
  },
  publicites: { date_maj: '2026-10-09', campagnes: [] },
  imagesDepot: ['LISEZMOI.md', 'ancienne.webp'],
};

const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('typeSelonSignature', () => {
  it('reconnaît WebP, PNG, JPEG et AVIF, rien d’autre', () => {
    expect(typeSelonSignature(WEBP)).toBe('image/webp');
    expect(typeSelonSignature(PNG)).toBe('image/png');
    expect(typeSelonSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    const avif = new TextEncoder().encode('\0\0\0\x1cftypavif');
    expect(typeSelonSignature(avif)).toBe('image/avif');
    expect(typeSelonSignature(new TextEncoder().encode('<svg xmlns='))).toBeNull();
  });
});

describe('estCheminPublie', () => {
  it('n’autorise que les données et les images d’annonce', () => {
    expect(estCheminPublie('src/data/affiliation.json')).toBe(true);
    expect(estCheminPublie('src/data/publicites.json')).toBe(true);
    expect(estCheminPublie('src/assets/publicites/promo-11.webp')).toBe(true);
    expect(estCheminPublie('src/assets/publicites/x.svg')).toBe(false);
    expect(estCheminPublie('src/assets/publicites/../../../netlify.toml')).toBe(false);
    expect(estCheminPublie('package.json')).toBe(false);
    expect(estCheminPublie('src/data/echeances.json')).toBe(false);
  });
});

describe('controleImage', () => {
  const ok = { type: 'image/webp', taille: 100_000, largeur: 1280, hauteur: 720, entete: WEBP };
  it('accepte une image conforme', () => expect(controleImage(ok)).toBeNull());
  it('refuse un format, un poids ou des dimensions hors limites', () => {
    expect(controleImage({ ...ok, type: 'image/gif' })).toMatch(/Format/);
    expect(controleImage({ ...ok, type: 'image/svg+xml' })).toMatch(/Format/);
    expect(controleImage({ ...ok, entete: PNG })).toMatch(/ne correspond pas/);
    expect(controleImage({ ...ok, taille: 400_000 })).toMatch(/lourde/);
    expect(controleImage({ ...ok, largeur: 600 })).toMatch(/petite/);
  });
});

describe('statutCampagne', () => {
  it('distingue suspendue, programmée, en cours et terminée', () => {
    expect(statutCampagne(campagne({ active: false }), '2026-11-10')).toBe('suspendue');
    expect(statutCampagne(campagne(), '2026-10-31')).toBe('programmée');
    expect(statutCampagne(campagne(), '2026-11-30')).toBe('en cours');
    expect(statutCampagne(campagne(), '2026-12-01')).toBe('terminée');
  });
});

describe('appliquerLien', () => {
  it('met à jour le lien et ses dates seulement s’il change', () => {
    const a = depart.affiliation;
    expect(appliquerLien(a, 'tiime', { url: '', reseau: '', actif: false }, '2026-11-02')).toBe(a);
    const b = appliquerLien(
      a,
      'tiime',
      { url: ' https://a.fr/t ', reseau: 'Affilae', actif: true },
      '2026-11-02',
    );
    expect(b.date_maj).toBe('2026-11-02');
    expect(b.liens['tiime']).toEqual({
      url: 'https://a.fr/t',
      reseau: 'Affilae',
      actif: true,
      maj: '2026-11-02',
    });
  });
});

describe('fichiersAPublier', () => {
  it('rien à publier sans changement, même si la date du brouillon a bougé', () => {
    expect(
      fichiersAPublier(
        depart,
        {
          affiliation: { ...depart.affiliation, date_maj: '2026-11-01' },
          publicites: { ...depart.publicites, date_maj: '2026-11-01' },
          images: new Map(),
        },
        '2026-11-02',
      ),
    ).toEqual([]);
  });

  it('publie le JSON modifié, l’image utilisée, et supprime l’image libérée', () => {
    const octets = new Uint8Array([1]);
    const avecAncienne: Depart = {
      ...depart,
      publicites: {
        date_maj: '2026-10-09',
        campagnes: [campagne({ id: 'ancienne', image: { fichier: 'ancienne.webp', alt: '' } })],
      },
    };
    const fichiers = fichiersAPublier(
      avecAncienne,
      {
        affiliation: depart.affiliation,
        publicites: {
          date_maj: '2026-11-02',
          campagnes: [campagne({ image: { fichier: 'exemple.webp', alt: '' } })],
        },
        images: new Map([
          ['exemple.webp', octets],
          ['abandonnee.webp', octets],
        ]),
      },
      '2026-11-02',
    );
    expect(
      fichiers.map((f) => [f.chemin, f.contenu === null ? 'suppression' : 'écriture']),
    ).toEqual([
      ['src/data/publicites.json', 'écriture'],
      ['src/assets/publicites/exemple.webp', 'écriture'],
      ['src/assets/publicites/ancienne.webp', 'suppression'],
    ]);
  });
});

describe('resumeModifications', () => {
  it('liste liens et annonces modifiés', () => {
    const lignes = resumeModifications(depart, {
      affiliation: appliquerLien(
        depart.affiliation,
        'tiime',
        { url: 'https://a.fr/t', reseau: 'Affilae', actif: true },
        '2026-11-02',
      ),
      publicites: { date_maj: '2026-11-02', campagnes: [campagne()] },
      images: new Map(),
    });
    expect(lignes).toEqual([
      'Lien affilié tiime : actif (Affilae)',
      'Annonce ajoutée : exemple (Exemple, 2026-11-01 → 2026-11-30)',
    ]);
  });
});
