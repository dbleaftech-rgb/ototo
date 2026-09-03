import { describe, it, expect } from 'vitest';
import {
  computeVehicleMeta,
  makeHeOf,
  makeNormOf,
  modelNormOf,
  computeScore,
  computeValuation,
} from '../src/index.js';

describe('Vehicle Names & Brand Normalization', () => {
  it('normalizes Kia Sportage correctly', () => {
    const meta = computeVehicleMeta({
      tozeret_nm: 'קיה סלובקיה',
      kinuy_mishari: 'SPORTAGE',
      ramat_gimur: 'URBAN',
      shnat_yitzur: 2019,
    });
    expect(meta.make).toBe('קיה');
    expect(meta.makeEn).toBe('KIA');
    expect(meta.model).toBe('SPORTAGE');
    expect(meta.year).toBe(2019);
    expect(meta.vehicleTitle).toBe('KIA SPORTAGE 2019');
  });

  it('handles country striping and letters normalization', () => {
    expect(makeHeOf("פיג'ו צרפת")).toBe("פיג'ו");
    expect(makeNormOf("פיג'ו")).toBe('פיזו');
    expect(makeNormOf('פולקסווגן')).toBe('פולקסווזן');
    expect(modelNormOf("ספורטג'")).toBe('ספורטז');
    expect(modelNormOf('ספורטאז')).toBe('ספורטז');
  });

  it('maps parent company to brand (e.g. Chrysler to Jeep, BMW to Mini)', () => {
    const jeep = computeVehicleMeta({
      tozeret_nm: 'קרייזלר ארהב',
      kinuy_mishari: 'WRANGLER',
      shnat_yitzur: 2021,
    });
    expect(jeep.make).toBe("ג'יפ");
    expect(jeep.makeEn).toBe('JEEP');

    const mini = computeVehicleMeta({
      tozeret_nm: 'ב מ וו גרמניה',
      kinuy_mishari: 'COOPER',
      shnat_yitzur: 2020,
    });
    expect(mini.make).toBe('מיני');
    expect(mini.makeEn).toBe('MINI');
  });
});

describe('Scoring Engine (CANON §6, D-042, D-043)', () => {
  it('calculates mid-point score honestly when mechanical is waiting', () => {
    const score = computeScore({
      accidentsScore: 90,
      ownershipScore: 85,
      mechanicalScore: null, // waiting for inspection
      historyScore: 95,
      kmScore: 80,
    });

    expect(score).not.toBeNull();
    if (!score) return;

    expect(score.modelVersion).toBe(3);
    expect(score.range.floor).toBeLessThan(score.range.ceil);
    expect(score.total).toBe(Math.round((score.range.floor + score.range.ceil) / 2));
    expect(score.potential).toBe(score.range.ceil);
    expect(score.verdict).toBe('green');
  });

  it('returns null for stolen vehicles', () => {
    const score = computeScore({
      accidentsScore: 90,
      ownershipScore: 90,
      mechanicalScore: 90,
      historyScore: 90,
      kmScore: 90,
      isStolen: true,
    });
    expect(score).toBeNull();
  });
});

describe('Valuation Engine (CANON §6א, D-049, D-102, D-103)', () => {
  it('applies sequential deductions with half-rates and 40% cap', () => {
    const result = computeValuation({
      basePrice: 100000,
      baseSource: 'median',
      marketHeat: 'normal', // -7.5% -> 92,500
      handsCount: 4,        // 6% deduction
      pastFleetType: 'rental', // 22% deduction
      vehicleYear: 2020,
      actualKm: 70000,
      referenceYear: 2024, // 4 years -> 70,000 km is exactly expected
    });

    expect(result.marketBase).toBe(92500);
    expect(result.final).toBeLessThan(result.marketBase);
    expect(result.ownership.capped).toBe(false);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('calculates leasing with duration ramp correctly', () => {
    const fullLeasing = computeValuation({
      basePrice: 100000,
      baseSource: 'guide',
      handsCount: 2,
      leasingMonths: 36, // full 1.0 factor -> 16%
      vehicleYear: 2021,
    });

    const shortLeasing = computeValuation({
      basePrice: 100000,
      baseSource: 'guide',
      handsCount: 2,
      leasingMonths: 6, // clamped to min factor 0.4 -> 16% * 0.4 = 6.4%
      vehicleYear: 2021,
    });

    expect(fullLeasing.final).toBeLessThan(shortLeasing.final);
  });
});
