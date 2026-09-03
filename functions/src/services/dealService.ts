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
  FINDINGS_CATALOG,
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
): Promise<{ dealId: string; dealToken: string; sellerToken: string; reportId?: string }> {
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

  let reportId: string | undefined;
  try {
    reportId = await buildReportAsync(dealId, cleanPlate, input, db);
  } catch (err) {
    console.error(`Failed building report for deal ${dealId}:`, err);
    await dealRef.update({ reportState: 'failed' });
  }

  return { dealId, dealToken, sellerToken, reportId };
}

export async function buildReportAsync(
  dealId: string,
  plate: string,
  input: Partial<CreateDealInput>,
  db: admin.firestore.Firestore
): Promise<string> {
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

  // Calculate hands count & detect past fleet
  const ownList = govData.ownershipHistory || [];
  const validOwns = ownList.filter((r: any) => (r.baalut || r.BAALUT) !== 'סוחר');
  const handsCount = Math.max(1, validOwns.length);

  let pastFleetType: any = undefined;
  let leasingMonths: number | undefined = undefined;

  for (let i = 0; i < validOwns.length; i++) {
    const b = String(validOwns[i].baalut || validOwns[i].BAALUT || '');
    const dt = Number(validOwns[i].baalut_dt || validOwns[i].BAALUT_DT || 0);

    if (b.includes('החכר') || b.includes('ליסינג')) {
      pastFleetType = 'company';
      // Calculate duration to next hand if available
      if (dt > 0 && i + 1 < validOwns.length) {
        const nextDt = Number(validOwns[i + 1].baalut_dt || validOwns[i + 1].BAALUT_DT || 0);
        if (nextDt > dt) {
          const y1 = Math.floor(dt / 100), m1 = dt % 100;
          const y2 = Math.floor(nextDt / 100), m2 = nextDt % 100;
          leasingMonths = Math.max(1, (y2 - y1) * 12 + (m2 - m1));
        }
      }
      if (!leasingMonths) leasingMonths = 36;
    } else if (b.includes('השכרה')) {
      pastFleetType = 'rental';
    } else if (b.includes('חברה')) {
      pastFleetType = 'company';
    } else if (b.includes('מונית')) {
      pastFleetType = 'taxi';
    } else if (b.includes('ממשל')) {
      pastFleetType = 'government';
    }
  }

  // Last test km & engine serial & structural flags
  const testRec = govData.testHistory || {};
  const lastTestKm = Number(testRec.kilometer_test_aharon) || undefined;
  const lastTestDate = reg.mivchan_acharon_dt ? String(reg.mivchan_acharon_dt).slice(0, 7) : undefined;
  const engineSerial = testRec.mispar_manoa || reg.degem_manoa || undefined;

  const hasColorChange = Number(testRec.shnui_zeva_ind) === 1;
  const hasStructuralChange = Number(testRec.shinui_mivne_ind) === 1;

  // Save vehicle cache to Firestore
  const vehicleDoc: Vehicle = {
    plate,
    make: meta.make,
    model: meta.model,
    year: meta.year || Number(reg.shnat_yitzur) || 2020,
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
    findings.push({ id: 'F-STOLEN', ...FINDINGS_CATALOG['F-STOLEN'] });
  }

  if (govData.isOffRoad) {
    findings.push({ id: 'F-OFF-ROAD', ...FINDINGS_CATALOG['F-OFF-ROAD'] });
  }

  if (govData.hasDisabledTag) {
    findings.push({ id: 'F-DISABLED-TAG', ...FINDINGS_CATALOG['F-DISABLED-TAG'] });
  }

  if (Array.isArray(govData.recalls) && govData.recalls.length > 0) {
    const openRecall = govData.recalls[0];
    const openDate = new Date(openRecall.TAARICH_PTICHA || openRecall.taarich_pticha || Date.now());
    const monthsOpen = (Date.now() - openDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOpen >= 6) {
      findings.push({ id: 'F-RECALL-BLOCKING', ...FINDINGS_CATALOG['F-RECALL-BLOCKING'] });
    } else {
      findings.push({ id: 'F-RECALL-OPEN', ...FINDINGS_CATALOG['F-RECALL-OPEN'] });
    }
  }

  if (hasColorChange) {
    findings.push({ id: 'F-COLOR-CHANGE', ...FINDINGS_CATALOG['F-COLOR-CHANGE'] });
  }

  // 3. Compute score
  const scoreResult = computeScore({
    accidentsScore: null, // waiting for seller consent & CheckID insurance
    ownershipScore: Math.max(50, 100 - (handsCount - 1) * 10 - (pastFleetType ? 15 : 0)),
    mechanicalScore: null, // waiting for inspection upload
    historyScore: hasColorChange ? 75 : 95,
    kmScore: 85,
    isStolen: checkIdInfo?.isStolen,
    isOffRoad: govData.isOffRoad || false,
  });

  // 4. Compute valuation
  const basePrice =
    checkIdInfo?.vehiclePrices?.find((p) => p.selected)?.price ||
    input.adPrice ||
    79000;

  const priceAdjust = computeValuation({
    basePrice,
    baseSource: checkIdInfo?.vehiclePrices?.length ? 'guide' : 'ad',
    handsCount,
    isFirstHandPrivate: handsCount === 1 && !pastFleetType,
    pastFleetType,
    leasingMonths,
    hasColorChange,
    hasUnspecifiedStructuralChange: hasStructuralChange,
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
    lastTestKm,
    lastTestDate,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await reportRef.set(reportData);

  // 6. Update deal state to ready
  await dealRef.update({
    reportId: reportRef.id,
    reportState: 'ready',
    updatedAt: new Date().toISOString(),
  });

  return reportRef.id;
}
