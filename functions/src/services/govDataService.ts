/**
 * govDataService.ts - Integration with Israel data.gov.il CKAN datastore APIs
 * Preserves CANON §7 semantics: null (failure) != [] (clean/empty)
 */

import { GOV_RESOURCE_IDS } from '@ototo/shared';

const GOV_BASE_URL = 'https://data.gov.il/api/3/action/datastore_search';

export interface GovQueryResult<T> {
  success: boolean;
  records: T[] | null;
  error?: string;
}

export async function queryGovDatastore<T = any>(
  resourceId: string,
  filters: Record<string, string | number>
): Promise<GovQueryResult<T>> {
  try {
    const url = new URL(GOV_BASE_URL);
    url.searchParams.set('resource_id', resourceId);
    url.searchParams.set('filters', JSON.stringify(filters));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        records: null,
        error: `Gov API HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as any;
    if (data?.success && Array.isArray(data?.result?.records)) {
      return {
        success: true,
        records: data.result.records,
      };
    }

    return {
      success: false,
      records: null,
      error: 'Invalid response format from data.gov.il',
    };
  } catch (err: any) {
    return {
      success: false,
      records: null,
      error: err?.message || 'Network error querying data.gov.il',
    };
  }
}

export interface VehicleGovData {
  registration: any | null;
  ownershipHistory: any[] | null;
  testHistory: any | null;
  hasDisabledTag: boolean | null;
  recalls: any[] | null;
  isOffRoad: boolean | null;
}

export async function fetchFullVehicleGovData(plate: string): Promise<VehicleGovData> {
  const plateNum = Number(plate.replace(/\D/g, ''));
  const plateStr = String(plateNum);

  const [
    regRes,
    ownRes,
    testRes,
    disabledRes,
    recallRes,
    offRoadRes,
  ] = await Promise.all([
    queryGovDatastore(GOV_RESOURCE_IDS.VEHICLE_REGISTRATION, { mispar_rechev: plateNum }),
    queryGovDatastore(GOV_RESOURCE_IDS.OWNERSHIP_HISTORY, { mispar_rechev: plateNum }),
    queryGovDatastore(GOV_RESOURCE_IDS.TEST_HISTORY_AND_KM, { mispar_rechev: plateNum }),
    queryGovDatastore(GOV_RESOURCE_IDS.DISABLED_TAG, { 'MISPAR RECHEV': plateNum }),
    queryGovDatastore(GOV_RESOURCE_IDS.SAFETY_RECALLS, { MISPAR_RECHEV: plateNum }),
    queryGovDatastore(GOV_RESOURCE_IDS.OFF_ROAD_CANCELLED, { mispar_rechev: plateNum }),
  ]);

  return {
    registration: regRes.records ? (regRes.records[0] || null) : null,
    ownershipHistory: ownRes.records,
    testHistory: testRes.records ? (testRes.records[0] || null) : null,
    hasDisabledTag: disabledRes.records ? disabledRes.records.length > 0 : null,
    recalls: recallRes.records,
    isOffRoad: offRoadRes.records ? offRoadRes.records.length > 0 : null,
  };
}
