import { describe, expect, it } from 'vitest';
import { campagneSchema, TEXTE_PUB_INTERDIT } from './schemas';

describe('TEXTE_PUB_INTERDIT', () => {
  it.each([
    'Le logiciel le mieux noté',
    'Logiciel noté par 2000 artisans',
    'Solution notée 4,8/5',
    'Élue solution de l’année',
    'Élus par les pros',
    'Élu meilleur outil',
    'Note de 4,8 sur 5',
    'notes 5/5',
    'Recommandé par les experts',
    'Classement 2026',
    'Le n° 1 de la facturation',
    'Numéro un en France',
    'Lisez nos avis',
    'Plateforme agréée',
  ])('refuse « %s »', (texte) => {
    expect(TEXTE_PUB_INTERDIT.test(texte)).toBe(true);
  });

  it.each([
    'Note de frais incluse',
    'Votre notaire vous conseille',
    'Notamment pour les artisans',
    'Élucidez vos factures',
    'Voir l’offre de l’annonceur',
    'Relu par un expert-comptable',
    'Factures conformes en 3 clics',
  ])('accepte « %s »', (texte) => {
    expect(TEXTE_PUB_INTERDIT.test(texte)).toBe(false);
  });
});

describe('campagneSchema : messages en français', () => {
  it('trop court, image mal nommée', () => {
    const r = campagneSchema.safeParse({
      id: 'annonce-test',
      annonceur: 'X',
      annonceur_legal: 'Exemple SAS, SIREN 123 456 789',
      outil: null,
      emplacement: 'accueil',
      familles: [],
      titre: 'Abc',
      texte: 'Un texte d’annonce correct',
      cta: 'Voir l’offre',
      url: 'https://exemple.fr/',
      image: { fichier: 'Promo.webp', alt: '' },
      debut: '2026-11-01',
      fin: '2026-11-30',
      active: true,
    });
    expect(r.success).toBe(false);
    const messages = Object.fromEntries(r.error!.issues.map((i) => [i.path.join('.'), i.message]));
    expect(messages).toMatchObject({
      annonceur: '2 caractères au moins',
      titre: '5 caractères au moins',
      'image.fichier': expect.stringMatching(/^nom d’image invalide/),
    });
  });
});
