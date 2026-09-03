/**
 * dealService.ts - Deal lifecycle, asynchronous report generation, and Firestore persistence
 */

import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import {
  computeVehicleMeta,
  computeScore,
  computeValuation,
  Deal,
  Vehicle,
  Finding,
} from '@ototo/shared';
import { fetchFullVehicleGovData } from './govDataService.js';
import { fetchCheckIdVehicleInfo } from './checkIdService.js';

export function generateSecureToken(): string {
  return randomBytes(16).toString('hex');
}

export interface CreateDealInput {
  buyerPhone: string;
  plate: string;
  buyerName?: string;
  adPrice?: number;
  declaredKm?: number;
  adMakeModel?: string;
}

export async function createDeal(
  input: CreateDealInput,
  db: admin.firestore.Firestore
): Promise<{ dealId: string; dealToken: string; sellerToken: string }> {
  const cleanPlate = input.plate.replace(/\D/g, '');
  const dealToken = generateSecureToken();
  const sellerToken = generateSecureToken();

  const dealRef = db.collection('deals').doc();
  const dealId = dealRef.id;

  const dealData: Deal = {
    id: dealId,
    dealToken,
    sellerToken,
    buyerPhone: input.buyerPhone,
    buyerName: input.buyerName,
    plate: cleanPlate,
    stage: 'free_info',
    reportState: 'building',
    adPrice: input.adPrice,
    declaredKm: input.declaredKm,
    adMakeModel: input.adMakeModel,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dealRef.set(dealData);

  // Trigger asynchronous report build in background
  buildReportAsync(dealId, cleanPlate, input, db).catch((err) => {
    console.error(`Failed building report for deal ${dealId}:`, err);
    dealRef.update({ reportState: 'failed' });
  });

  return { dealId, dealToken, sellerToken };
}

export async function buildReportAsync(
  dealId: string,
  plate: string,
  input: Partial<CreateDealInput>,
  db: admin.firestore.Firestore
): Promise<void> {
  const dealRef = db.collection('deals').doc(dealId);

  // 1. Fetch Gov Data & CheckID in parallel
  const [govData, checkIdInfo] = await Promise.all([
    fetchFullVehicleGovData(plate),
    fetchCheckIdVehicleInfo(plate),
  ]);

  const reg = govData.registration || {};
  const meta = computeVehicleMeta({
    tozeret_nm: reg.tozeret_nm,
    kinuy_mishari: reg.kinuy_mishari,
    ramat_gimur: reg.ramat_gimur,
    shnat_yitzur: reg.shnat_yitzur,
  });

  // Calculate hands count from ownership history
  const ownList = govData.ownershipHistory || [];
  const handsCount = Math.max(1, ownList.filter((r: any) => r.BAALUT !== 'סוחר').length);

  // Last test km & engine serial
  const testRec = govData.testHistory || {};
  const lastTestKm = Number(testRec.kilometer_test_aharon) || undefined;
  const lastTestDate = testRec.mivchan_acharon_dt ? String(testRec.mivchan_acharon_dt).slice(0, 7) : undefined;
  const engineSerial = testRec.mispar_manoa || undefined;

  // Save vehicle cache to Firestore
  const vehicleDoc: Vehicle = {
    plate,
    make: meta.make,
    model: meta.model,
    year: meta.year || 2020,
    subModel: meta.subModel,
    color: reg.tzeva_rechev,
    engineSerial,
    lastTestKm,
    lastTestDate,
    currentHands: handsCount,
    isStolen: checkIdInfo?.isStolen || false,
    disabledTag: govData.hasDisabledTag || false,
    enrichedAt: new Date().toISOString(),
  };
  await db.collection('vehicles').doc(plate).set(vehicleDoc, { merge: true });

  // 2. Determine findings
  const findings: Finding[] = [];
  if (checkIdInfo?.isStolen) {
    findings.push({
      id: 'F-STOLEN',
      code: 'F-STOLEN',
      title: 'רכב רשום כגנוב במשטרה',
      severity: 'risk',
      category: 'blockers',
      detail: 'הרכב מסומן כגנוב פעיל. העסקה אינה בת-ביצוע.',
      isBlocker: true,
    });
  }

  if (govData.hasDisabledTag) {
    findings.push({
      id: 'F-DISABLED-TAG',
      code: 'F-DISABLED-TAG',
      title: 'תו נכה פעיל על הרכב',
      severity: 'warn',
      category: 'blockers',
      detail: 'על הרכב רשום תו חניה לנכה. נדרש שחרור התו לפני העברת בעלות.',
      isBlocker: true,
    });
  }

  // 3. Compute score
  const scoreResult = computeScore({
    accidentsScore: null, // waiting for seller consent & CheckID insurance
    ownershipScore: Math.max(50, 100 - (handsCount - 1) * 10),
    mechanicalScore: null, // waiting for inspection upload
    historyScore: 95,
    kmScore: 85,
    isStolen: checkIdInfo?.isStolen,
    isOffRoad: govData.isOffRoad || false,
  });

  // 4. Compute valuation
  const basePrice =
    checkIdInfo?.vehiclePrices?.find((p) => p.selected)?.price ||
    input.adPrice ||
    75000;

  const priceAdjust = computeValuation({
    basePrice,
    baseSource: checkIdInfo?.vehiclePrices?.length ? 'guide' : 'ad',
    handsCount,
    vehicleYear: meta.year || 2020,
    actualKm: input.declaredKm || lastTestKm,
  });

  // 5. Save report to Firestore
  const reportRef = db.collection('reports').doc();
  const reportData = {
    id: reportRef.id,
    dealId,
    plate,
    vehicleMeta: meta,
    score: scoreResult,
    priceAdjust,
    findings,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await reportRef.set(reportData);

  // 6. Update deal state to ready
  await dealRef.update({
    reportId: reportRef.id,
    reportState: 'ready',
    updatedAt: new Date().toISOString(),
  });
}
