import { describe, expect, it } from 'vitest';
import { jetonsVerificationGoogle } from './search-console';

const JETON = 'aBcD1234_efgh-5678IJKLmnopQRSTuvwx';

describe('jetonsVerificationGoogle', () => {
  it('aucune balise sans variable', () => {
    expect(jetonsVerificationGoogle(undefined)).toEqual([]);
    expect(jetonsVerificationGoogle('  ')).toEqual([]);
  });

  it('un ou plusieurs jetons, espaces et doublons retirés', () => {
    expect(jetonsVerificationGoogle(` ${JETON} `)).toEqual([JETON]);
    expect(jetonsVerificationGoogle(`${JETON},${JETON}, autreJeton_0123456789abcdef`)).toEqual([
      JETON,
      'autreJeton_0123456789abcdef',
    ]);
  });

  it('rejette tout ce qui pourrait sortir de l’attribut content', () => {
    expect(jetonsVerificationGoogle('"><script>alert(1)</script>')).toEqual([]);
    expect(jetonsVerificationGoogle('<meta name="google-site-verification" content="x">')).toEqual(
      [],
    );
    expect(jetonsVerificationGoogle('court')).toEqual([]);
  });
});
