import { describe, expect, it } from 'vitest';
import { validerDemandeRappel } from './email-capture';

describe('validerDemandeRappel', () => {
  it('accepte une demande complète avec consentement explicite', () => {
    const r = validerDemandeRappel({
      email: 'Pro@Exemple.fr ',
      metier: 'plombier',
      consentement: true,
    });
    expect(r).toEqual({
      ok: true,
      demande: { email: 'pro@exemple.fr', metier: 'plombier', consentement: true },
    });
  });

  it('refuse sans consentement explicite (case jamais précochée)', () => {
    expect(validerDemandeRappel({ email: 'a@b.fr', consentement: false }).ok).toBe(false);
    expect(validerDemandeRappel({ email: 'a@b.fr' }).ok).toBe(false);
    expect(validerDemandeRappel({ email: 'a@b.fr', consentement: 'true' }).ok).toBe(false);
  });

  it('refuse les emails invalides', () => {
    for (const email of ['', 'a@b', 'a b@c.fr', 'a@.fr', `${'x'.repeat(250)}@exemple.fr`]) {
      expect(validerDemandeRappel({ email, consentement: true }).ok).toBe(false);
    }
  });

  it('le métier est facultatif mais doit être un slug propre', () => {
    expect(validerDemandeRappel({ email: 'a@b.fr', consentement: true })).toMatchObject({
      ok: true,
      demande: { metier: null },
    });
    expect(
      validerDemandeRappel({ email: 'a@b.fr', metier: '<script>', consentement: true }).ok,
    ).toBe(false);
  });
});
