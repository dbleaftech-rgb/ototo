/**
 * scoringEngine.ts - 6-pillar vehicle scoring model for Ototo
 * Implementations strictly follow CANON §6, D-042 and D-043 (modelVersion: 3)
 */

import { SCORE_PILLAR_WEIGHTS, SCORE_THRESHOLDS } from './constants/index.js';
import { ScorePillar, ScorePillarsMap, ScoreResult, Verdict } from './types/index.js';

export interface ComputeScoreInput {
  accidentsScore: number | null; // 0-100 or null if not checked
  ownershipScore: number | null;
  mechanicalScore: number | null; // 0-100 from Machon OCR or null if waiting
  historyScore: number | null;
  kmScore: number | null;
  isStolen?: boolean;
  isOffRoad?: boolean;
  hasMajorAccident?: boolean;
  reasons?: {
    accidents?: string;
    ownership?: string;
    mechanical?: string;
    history?: string;
    km?: string;
  };
}

export function computeScore(input: ComputeScoreInput): ScoreResult | null {
  // If actively stolen or cancelled off-road, no score is produced
  if (input.isStolen || input.isOffRoad) {
    return null;
  }

  const weights = SCORE_PILLAR_WEIGHTS;
  const totalPossibleWeights =
    weights.ACCIDENTS_INSURANCE +
    weights.OWNERSHIP_RELIABILITY +
    weights.MECHANICAL_CONDITION +
    weights.VEHICLE_HISTORY_CONDITION +
    weights.KM_VS_YEAR; // 90 points base

  const pillars: ScorePillarsMap = {
    accidents_insurance: {
      name: 'עבר תאונות וביטוח',
      weight: weights.ACCIDENTS_INSURANCE,
      score: input.accidentsScore,
      status: input.accidentsScore !== null ? 'measured' : 'waiting',
      reason: input.reasons?.accidents || (input.accidentsScore !== null ? 'בדיקת עבר ביטוחי ותביעות' : 'ממתין לאישור מוכר לשליפת נתוני ביטוח'),
    },
    ownership_reliability: {
      name: 'היסטוריית בעלות ואמינות',
      weight: weights.OWNERSHIP_RELIABILITY,
      score: input.ownershipScore,
      status: input.ownershipScore !== null ? 'measured' : 'waiting',
      reason: input.reasons?.ownership || 'בדיקת מספר בעלויות ומקוריות רישום',
    },
    mechanical_condition: {
      name: 'מצב מכני ובדיקת מכון',
      weight: weights.MECHANICAL_CONDITION,
      score: input.mechanicalScore,
      status: input.mechanicalScore !== null ? 'measured' : 'waiting',
      reason: input.reasons?.mechanical || (input.mechanicalScore !== null ? 'פוענח מדוח בדיקת מכון' : 'ממתין להעלאת דוח בדיקת מכון'),
    },
    vehicle_history_condition: {
      name: 'עבר הרכב ורישוי',
      weight: weights.VEHICLE_HISTORY_CONDITION,
      score: input.historyScore,
      status: input.historyScore !== null ? 'measured' : 'waiting',
      reason: input.reasons?.history || 'בדיקת שינויי מבנה, צבע, מנוע וריקולים',
    },
    km_vs_year: {
      name: 'ק״מ מול שנתון',
      weight: weights.KM_VS_YEAR,
      score: input.kmScore,
      status: input.kmScore !== null ? 'measured' : 'waiting',
      reason: input.reasons?.km || 'בדיקת נסועה מול ממוצע שנתון וקריאות טסט',
    },
  };

  let measuredFloorSum = 0;
  let missingWeights = 0;

  for (const pillar of Object.values(pillars) as ScorePillar[]) {
    if (pillar.score !== null) {
      measuredFloorSum += (pillar.score * pillar.weight) / totalPossibleWeights;
    } else {
      missingWeights += (100 * pillar.weight) / totalPossibleWeights;
    }
  }

  const floor = Math.round(measuredFloorSum);
  const ceil = Math.round(measuredFloorSum + missingWeights);
  const midScore = Math.round((floor + ceil) / 2);
  const potential = ceil;

  let verdict: Verdict = 'green';
  if (input.hasMajorAccident || midScore < SCORE_THRESHOLDS.CAUTION) {
    verdict = 'red';
  } else if (midScore < SCORE_THRESHOLDS.GOOD) {
    verdict = 'yellow';
  }

  return {
    total: midScore,
    potential,
    range: {
      floor,
      ceil,
      score: midScore,
    },
    verdict,
    pillars,
    modelVersion: 3,
  };
}
