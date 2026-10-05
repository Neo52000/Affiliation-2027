import { describe, expect, it } from 'vitest';
import echeancesData from '../data/echeances.json';
import { situerEcheances, type Echeance } from './echeance';

const ECHEANCES = echeancesData.echeances as Echeance[];

describe('situerEcheances', () => {
  it('TPE/micro assujettie : réception générale + émission et e-reporting à son échéance', () => {
    const s = situerEcheances('pme-tpe-micro', 'assujetti', ECHEANCES);
    expect(s.horsChamp).toBe(false);
    expect(s.reception?.id).toBe('reception-toutes-entreprises');
    expect(s.emission?.id).toBe('emission-pme-tpe-micro');
    expect(s.eReporting?.id).toBe('e-reporting-pme-tpe-micro');
    expect(s.checklist.length).toBeGreaterThanOrEqual(5);
  });

  it('GE/ETI : émission et e-reporting à leur propre échéance', () => {
    const s = situerEcheances('ge-eti', 'assujetti', ECHEANCES);
    expect(s.emission?.id).toBe('emission-ge-eti');
    expect(s.eReporting?.id).toBe('e-reporting-ge-eti');
  });

  it('franchise en base : mêmes obligations + rappel de la mention art. 293 B', () => {
    const s = situerEcheances('pme-tpe-micro', 'franchise', ECHEANCES);
    expect(s.horsChamp).toBe(false);
    expect(s.emission?.id).toBe('emission-pme-tpe-micro');
    expect(s.checklist.join(' ')).toContain('293 B');
  });

  it('non assujetti : hors champ, message prudent, aucune date', () => {
    const s = situerEcheances('pme-tpe-micro', 'non-assujetti', ECHEANCES);
    expect(s.horsChamp).toBe(true);
    expect(s.message).toBeTruthy();
    expect(s.reception).toBeNull();
    expect(s.emission).toBeNull();
  });

  it('les dates retournées viennent du fichier de données (jamais en dur)', () => {
    const s = situerEcheances('pme-tpe-micro', 'assujetti', ECHEANCES);
    const idsFichier = new Set(ECHEANCES.map((e) => e.id));
    for (const e of [s.reception, s.emission, s.eReporting]) {
      expect(idsFichier.has(e!.id)).toBe(true);
      expect(e!.sources.length).toBeGreaterThan(0);
    }
  });

  it('échéance absente du fichier = erreur explicite', () => {
    expect(() => situerEcheances('ge-eti', 'assujetti', [])).toThrow(/échéance manquante/);
  });
});
