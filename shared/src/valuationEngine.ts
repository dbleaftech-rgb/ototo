/**
 * valuationEngine.ts - Historical & market valuation adjustment engine for Ototo
 * Implementations strictly follow CANON §6א, D-049, D-102, D-103 and D-104
 */

import { VALUATION_DEFAULTS } from './constants/index.js';
import { PriceAdjust, PriceAdjustStep } from './types/index.js';

export interface ValuationInput {
  basePrice: number;
  baseSource: 'median' | 'guide' | 'ad';
  marketHeat?: 'hot' | 'normal' | 'cold' | 'unknown';
  handsCount: number;
  isFirstHandPrivate?: boolean;
  pastFleetType?: 'government' | 'rental' | 'company' | 'driving_school' | 'taxi' | 'tourism' | 'parallel_import' | 'personal_import' | 'un';
  leasingMonths?: number;
  insuranceImpairmentPct?: number;
  hasUnratedClaim?: boolean;
  isTotaledRestored?: boolean;
  isTheftReturned?: boolean;
  hasColorChange?: boolean;
  hasUnspecifiedStructuralChange?: boolean;
  hasEngineSwap?: boolean;
  isStandingExpiredTest?: boolean;
  vehicleYear: number;
  actualKm?: number;
  referenceYear?: number;
}

export function computeValuation(input: ValuationInput): PriceAdjust {
  const steps: PriceAdjustStep[] = [];
  let currentVal = input.basePrice;
  const baseKind = input.baseSource;

  // 1. Market Heat Discount (D-103) - applies to median asking prices to estimate closing price
  let marketBase = currentVal;
  if (baseKind === 'median') {
    const heat = input.marketHeat || 'unknown';
    let discountPct: number = VALUATION_DEFAULTS.MARKET_DISCOUNT.NORMAL;
    if (heat === 'hot') discountPct = VALUATION_DEFAULTS.MARKET_DISCOUNT.HOT;
    else if (heat === 'cold') discountPct = VALUATION_DEFAULTS.MARKET_DISCOUNT.COLD;

    const delta = Math.round((currentVal * discountPct) / 100);
    currentVal -= delta;
    marketBase = currentVal;
    steps.push({
      kind: 'market',
      label: `התאמת שוק להערכת מחיר סגירה (${heat})`,
      pct: -discountPct,
      delta: -delta,
      after: currentVal,
    });
  }

  // 2. Block 1: Ownership History
  // Deductions are applied sequentially. First full, 2nd & 3rd at HALF rate. Max 3. Capped at 40% of base.
  const ownershipDeductions: Array<{ label: string; rawPct: number }> = [];

  // Leasing with duration ramp (D-102)
  if (input.leasingMonths !== undefined && input.leasingMonths > 0) {
    const rampRatio = input.leasingMonths / VALUATION_DEFAULTS.LEASING_RAMP_MONTHS;
    const factor = Math.max(VALUATION_DEFAULTS.LEASING_MIN_FACTOR, Math.min(1.0, rampRatio));
    const effectivePct = Number((VALUATION_DEFAULTS.PAST_LIFE_PCT.LEASING_BASE * factor).toFixed(1));
    ownershipDeductions.push({
      label: `עבר ליסינג/החכר (${input.leasingMonths} חודשים)`,
      rawPct: effectivePct,
    });
  } else if (input.pastFleetType) {
    const map = {
      government: { label: 'עבר ממשלתי/מדינה', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.GOVERNMENT },
      rental: { label: 'עבר השכרה', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.RENTAL },
      company: { label: 'עבר חברה', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.COMPANY },
      driving_school: { label: 'עבר לימוד נהיגה', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.DRIVING_SCHOOL },
      taxi: { label: 'עבר מונית', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.TAXI },
      tourism: { label: 'עבר סיור ותיור', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.TOURISM },
      parallel_import: { label: 'ייבוא מקביל', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.PARALLEL_IMPORT },
      personal_import: { label: 'ייבוא אישי', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.PERSONAL_IMPORT },
      un: { label: 'עבר או״ם', pct: VALUATION_DEFAULTS.PAST_LIFE_PCT.UN },
    };
    const item = map[input.pastFleetType];
    if (item) {
      ownershipDeductions.push({ label: item.label, rawPct: item.pct });
    }
  }

  // Hands steps
  if (input.handsCount === 3) {
    ownershipDeductions.push({ label: 'יד 3', rawPct: VALUATION_DEFAULTS.HANDS_STEPS.HANDS_3 });
  } else if (input.handsCount === 4) {
    ownershipDeductions.push({ label: 'יד 4', rawPct: VALUATION_DEFAULTS.HANDS_STEPS.HANDS_4 });
  } else if (input.handsCount >= 5) {
    ownershipDeductions.push({ label: `יד ${input.handsCount}`, rawPct: VALUATION_DEFAULTS.HANDS_STEPS.HANDS_5_PLUS });
  }

  // Sort descending by rawPct
  ownershipDeductions.sort((a, b) => b.rawPct - a.rawPct);
  const topOwnership = ownershipDeductions.slice(0, 3);

  let totalOwnershipDelta = 0;
  const ownershipLabels: string[] = [];
  const floorVal = Math.round(marketBase * (1 - VALUATION_DEFAULTS.OWNERSHIP_DEDUCTION_CAP_PCT / 100));
  let hitCap = false;

  topOwnership.forEach((item, idx) => {
    // 1st is full, 2nd & 3rd are half
    const appliedPct = idx === 0 ? item.rawPct : Number((item.rawPct / 2).toFixed(1));
    const stepDelta = Math.round((currentVal * appliedPct) / 100);

    if (currentVal - stepDelta < floorVal) {
      const allowedDelta = currentVal - floorVal;
      currentVal = floorVal;
      totalOwnershipDelta += allowedDelta;
      hitCap = true;
      steps.push({
        kind: 'ownership',
        label: `${item.label} (תקרת 40% הופעלה)`,
        pct: -appliedPct,
        delta: -allowedDelta,
        after: currentVal,
      });
    } else {
      currentVal -= stepDelta;
      totalOwnershipDelta += stepDelta;
      steps.push({
        kind: 'ownership',
        label: idx === 0 ? item.label : `${item.label} (שקלול חלקי)`,
        pct: -appliedPct,
        delta: -stepDelta,
        after: currentVal,
      });
    }
    ownershipLabels.push(item.label);
  });

  // First-hand private bonus
  if (input.isFirstHandPrivate && input.handsCount === 1) {
    const bonus = Math.round((currentVal * VALUATION_DEFAULTS.FIRST_HAND_BONUS_PCT) / 100);
    currentVal += bonus;
    totalOwnershipDelta -= bonus;
    steps.push({
      kind: 'ownership',
      label: 'יד ראשונה פרטית ללא עבר ציי רכב',
      pct: VALUATION_DEFAULTS.FIRST_HAND_BONUS_PCT,
      delta: bonus,
      after: currentVal,
    });
    ownershipLabels.push('בונוס יד ראשונה פרטית');
  }

  // 3. Block 2: Condition & Insurance Impairments (Full value, no cap, D-049)
  if (input.insuranceImpairmentPct && input.insuranceImpairmentPct > 0) {
    const delta = Math.round((currentVal * input.insuranceImpairmentPct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: `ירידת ערך מתועדת בדוח שמאי (${input.insuranceImpairmentPct}%)`,
      pct: -input.insuranceImpairmentPct,
      delta: -delta,
      after: currentVal,
    });
  }

  if (input.hasUnratedClaim) {
    const pct = VALUATION_DEFAULTS.CONDITION_PCT.ACCIDENT_NO_RATE;
    const delta = Math.round((currentVal * pct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: 'תביעת ביטוח ללא ציון ירידת ערך',
      pct: -pct,
      delta: -delta,
      after: currentVal,
    });
  }

  if (input.isTotaledRestored) {
    const pct = VALUATION_DEFAULTS.CONDITION_PCT.TOTALED;
    const delta = Math.round((currentVal * pct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: 'אובדן להלכה / טוטאלוס משוקם',
      pct: -pct,
      delta: -delta,
      after: currentVal,
    });
  }

  if (input.isTheftReturned) {
    const pct = VALUATION_DEFAULTS.CONDITION_PCT.THEFT_RETURNED;
    const delta = Math.round((currentVal * pct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: 'רכב שנגנב והוחזר לבעליו',
      pct: -pct,
      delta: -delta,
      after: currentVal,
    });
  }

  if (input.hasColorChange) {
    const pct = VALUATION_DEFAULTS.CONDITION_PCT.COLOR_CHANGE;
    const delta = Math.round((currentVal * pct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: 'שינוי צבע רכב רשום',
      pct: -pct,
      delta: -delta,
      after: currentVal,
    });
  }

  if (input.hasUnspecifiedStructuralChange) {
    const pct = VALUATION_DEFAULTS.CONDITION_PCT.STRUCTURE_UNSPECIFIED;
    const delta = Math.round((currentVal * pct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: 'שינוי מבנה ללא פירוט (חשד לתיקון מהותי)',
      pct: -pct,
      delta: -delta,
      after: currentVal,
    });
  }

  if (input.hasEngineSwap) {
    const pct = VALUATION_DEFAULTS.CONDITION_PCT.ENGINE_SWAP;
    const delta = Math.round((currentVal * pct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: 'החלפת מנוע רשומה במרשם (F-ENGINE-SWAP)',
      pct: -pct,
      delta: -delta,
      after: currentVal,
    });
  }

  if (input.isStandingExpiredTest) {
    const pct = VALUATION_DEFAULTS.CONDITION_PCT.STANDING_EXPIRED_TEST;
    const delta = Math.round((currentVal * pct) / 100);
    currentVal -= delta;
    steps.push({
      kind: 'condition',
      label: 'רכב עומד (טסט פג מעל שנה)',
      pct: -pct,
      delta: -delta,
      after: currentVal,
    });
  }

  // 4. Block 3: KM Adjustment
  if (input.actualKm && input.actualKm > 0) {
    const refYear = input.referenceYear || new Date().getFullYear();
    const ageYears = Math.max(1, refYear - input.vehicleYear);
    const expectedKm = ageYears * VALUATION_DEFAULTS.ANNUAL_EXPECTED_KM;
    const kmRatio = input.actualKm / expectedKm;

    let kmPct = 0;
    if (kmRatio >= 2.0) kmPct = -12;
    else if (kmRatio >= 1.5) kmPct = -5;
    else if (kmRatio >= 1.1) kmPct = -2;
    else if (kmRatio <= 0.7) kmPct = 3;
    else if (kmRatio <= 0.9) kmPct = 1.5;

    if (kmPct !== 0) {
      const delta = Math.round((currentVal * kmPct) / 100);
      currentVal += delta;
      steps.push({
        kind: 'km',
        label: kmPct < 0 ? `ק״מ גבוה מהממוצע (${Math.round(input.actualKm).toLocaleString()} ק״מ)` : `ק״מ נמוך מהממוצע (${Math.round(input.actualKm).toLocaleString()} ק״מ)`,
        pct: kmPct,
        delta: delta,
        after: currentVal,
      });
    }
  }

  return {
    base: input.basePrice,
    baseSource: input.baseSource,
    baseKind,
    steps,
    final: currentVal,
    ownership: {
      delta: totalOwnershipDelta,
      pct: Number(((totalOwnershipDelta / marketBase) * 100).toFixed(1)),
      capped: hitCap,
      labels: ownershipLabels,
    },
    marketBase,
  };
}
