export type Stage = 'free_info' | 'full_report' | 'inspection' | 'closing';

export type ReportState = 'building' | 'ready' | 'failed';

export type Verdict = 'green' | 'yellow' | 'red';

export type BlockerType = 'disabled_tag' | 'recall' | 'lien' | 'off_road';

export type BlockerStatus = 'detected' | 'in_progress' | 'cleared';

export interface ScorePillar {
  name: string;
  weight: number;
  score: number | null; // null if not measured/waiting
  status: 'measured' | 'waiting' | 'failed';
  reason: string;
  source?: string;
  date?: string;
}

export interface ScorePillarsMap {
  accidents_insurance: ScorePillar;
  ownership_reliability: ScorePillar;
  mechanical_condition: ScorePillar;
  vehicle_history_condition: ScorePillar;
  km_vs_year: ScorePillar;
}

export interface ScoreRange {
  floor: number;
  ceil: number;
  score: number; // mid-point round((floor + ceil) / 2)
}

export interface ScoreResult {
  total: number;
  potential: number;
  range: ScoreRange;
  verdict: Verdict;
  pillars: ScorePillarsMap;
  modelVersion: 3;
}

export interface Finding {
  id: string; // e.g. F-ACCIDENT-MAJOR, F-RECALL, F-DISABLED-TAG
  code: string;
  title: string;
  severity: 'risk' | 'warn' | 'info' | 'ok';
  category: 'accidents' | 'ownership' | 'mechanical' | 'history' | 'blockers';
  detail: string;
  impactScore?: number;
  impactIls?: number;
  repairRangeIls?: { min: number; max: number };
  leverageText?: string;
  isBlocker?: boolean;
}

export interface PriceAdjustStep {
  kind: 'ownership' | 'condition' | 'km' | 'market' | 'fee';
  label: string;
  pct: number;
  delta: number;
  after: number;
}

export interface PriceAdjust {
  base: number;
  baseSource: 'median' | 'guide' | 'ad';
  baseKind: 'median' | 'guide' | 'ad';
  steps: PriceAdjustStep[];
  final: number;
  ownership: {
    delta: number;
    pct: number;
    capped: boolean;
    labels: string[];
  };
  marketBase?: number;
  marketCls?: string;
}

export interface Deal {
  id: string;
  dealToken: string;
  sellerToken: string;
  buyerPhone: string;
  buyerName?: string;
  buyerAge?: number;
  buyerTazMasked?: string;
  sellerPhone?: string;
  plate: string;
  stage: Stage;
  reportState: ReportState;
  reportId?: string;
  carImage?: string;
  adPrice?: number;
  declaredKm?: number;
  adMakeModel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  plate: string;
  make: string;
  model: string;
  year: number;
  subModel?: string;
  color?: string;
  engineSerial?: string;
  engineSwapAt?: string;
  lastTestKm?: number;
  lastTestDate?: string;
  currentHands: number;
  originality?: string;
  isStolen?: boolean;
  disabledTag?: boolean;
  recalls?: Array<{
    recallId: string;
    description: string;
    noticeDate: string;
    blocksTransferAt: string;
    isBlocking: boolean;
  }>;
  ownershipHistory?: Array<{
    handNumber: number;
    ownerType: string;
    startDate: string;
    endDate?: string;
    monthsDuration?: number;
  }>;
  insuranceData?: {
    claimsCount: number;
    claimsDetails: Array<{
      eventDate: string;
      claimType: string;
      impairmentRate?: number;
      impairmentAmount?: number;
    }>;
    ownerAuthenticated: boolean;
    totalLoss: boolean;
    theftRecovered: boolean;
  };
  enrichedAt: string;
}

export interface SellerConsent {
  id: string;
  dealToken: string;
  sellerPhone: string;
  ownerTazMasked: string;
  ownershipDate: string;
  consentAt: string;
  consentTextVersion: string;
  signerIp: string;
  docHash: string;
}

export interface MoUContract {
  id: string;
  dealToken: string;
  buyerSignedAt?: string;
  sellerSignedAt?: string;
  buyerSignaturePng?: string;
  sellerSignaturePng?: string;
  buyerIp?: string;
  sellerIp?: string;
  agreedPrice: number;
  blockersIncluded: string[];
  docHash: string;
  status: 'draft' | 'buyer_signed' | 'fully_signed';
  pdfUrl?: string;
}
