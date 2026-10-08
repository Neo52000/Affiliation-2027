import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { empreinte, empreintesAutorisees, fichierHeaders, politique, scriptsEnLigne } from './csp';

describe('scriptsEnLigne', () => {
  it('retient les scripts exécutables et ignore les blocs de données et les fichiers externes', () => {
    const html = `
      <script type="application/ld+json">{"@type":"WebSite"}</script>
      <script type="module">document.body.dataset.a = '1';</script>
      <script>(()=>{var a=1})();</script>
      <script src="/_astro/x.js"></script>
      <script type="module" src="/_astro/y.js"></script>
      <script type="text/template"><p>x</p></script>
      <SCRIPT TYPE="text/javascript">b()</SCRIPT>`;
    expect(scriptsEnLigne(html)).toEqual([
      "document.body.dataset.a = '1';",
      '(()=>{var a=1})();',
      'b()',
    ]);
  });
});

describe('empreinte', () => {
  it('suit la définition CSP : sha256 en base64 des octets exacts', () => {
    const attendu = createHash('sha256').update('é = 1;', 'utf8').digest('base64');
    expect(empreinte('é = 1;')).toBe(`'sha256-${attendu}'`);
  });
});

describe('politique et _headers', () => {
  it('autorise exactement les empreintes fournies, triées et sans doublon', () => {
    const csp = politique(["'sha256-b'", "'sha256-a'", "'sha256-b'"]);
    expect(csp).toContain("script-src 'self' 'sha256-a' 'sha256-b';");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe-eval');
  });

  it('relit les empreintes autorisées depuis le fichier _headers', () => {
    const fichier = fichierHeaders(politique(["'sha256-YQ=='", "'sha256-Yg=='"]));
    expect(empreintesAutorisees(fichier)).toEqual(new Set(["'sha256-YQ=='", "'sha256-Yg=='"]));
    expect(empreintesAutorisees('')).toEqual(new Set());
  });
});
