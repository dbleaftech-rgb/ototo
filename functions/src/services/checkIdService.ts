/**
 * checkIdService.ts - Verified integration with CheckID / Tabu API
 * Strictly enforces CANON §4 and §10:
 * - Header is EX-API-TOKEN
 * - VehicleInfo is free
 * - VehicleInsurance is paid (22 ILS + VAT) and strictly requires Seller Consent
 * - Claims field is spelled 'CliamsDetails' / 'cliamsDetails'
 */

const CHECKID_HOST = 'https://m.tabu.co.il/exApi/v1';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getCheckIdAuthToken(username?: string, password?: string): Promise<string> {
  const user = username || process.env.CHECKID_USERNAME;
  const pass = password || process.env.CHECKID_PASSWORD;

  if (!user || !pass) {
    throw new Error('CheckID credentials (CHECKID_USERNAME / CHECKID_PASSWORD) not configured');
  }

  // Reuse cached token if valid with 5-minute buffer
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const url = `${CHECKID_HOST}/ExternalAuthentication/SignIn?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&testMode=false`;
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    throw new Error(`CheckID authentication failed with HTTP ${res.status}`);
  }

  const data = (await res.json()) as any;
  if (!data?.result?.token) {
    throw new Error('CheckID authentication did not return a valid token');
  }

  // Token is valid ~60 minutes
  cachedToken = {
    token: data.result.token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return cachedToken.token;
}

export interface CheckIdVehicleInfo {
  isStolen: boolean;
  vehiclePrices?: Array<{
    price: number;
    selected?: boolean;
    degem?: string;
  }>;
  specs?: any;
}

export async function fetchCheckIdVehicleInfo(plate: string): Promise<CheckIdVehicleInfo | null> {
  try {
    const token = await getCheckIdAuthToken();
    const url = `${CHECKID_HOST}/CheckId/GetData/VehicleInfoDataModel?IdType=IsraeliCar&Id=${encodeURIComponent(plate)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'EX-API-TOKEN': token,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as any;
    const model = data?.result || data?.data;
    if (!model) return null;

    return {
      isStolen: Boolean(model.isStolen || model.IsStolen),
      vehiclePrices: model.vehiclePrices || model.VehiclePrices || [],
      specs: model,
    };
  } catch (err) {
    console.error('CheckID VehicleInfo error:', err);
    return null;
  }
}

export interface CheckIdInsuranceResult {
  claims: Array<{
    eventDate: string;
    claimType: string;
    impairmentRate?: number;
    impairmentAmount?: number;
  }>;
  ownerAuthenticated: boolean;
  rawResponse: any;
}

/**
 * Fetch vehicle insurance claims history.
 * CANON §4: STRICTLY requires ownerId and ownershipDate, and ownerName must be "בעל הרכב".
 */
export async function fetchCheckIdInsurance(
  plate: string,
  ownerTaz: string,
  ownershipDate: string, // DD-MM-YYYY
  hasConsent: boolean
): Promise<CheckIdInsuranceResult | null> {
  if (!hasConsent) {
    throw new Error('CANON §4 violation: Cannot query CheckID Insurance without verified Amendment 13 Seller Consent');
  }

  try {
    const token = await getCheckIdAuthToken();
    const url = `${CHECKID_HOST}/CheckId/GetData/VehicleInsuranceDataModel?IdType=IsraeliCar&Id=${encodeURIComponent(plate)}&ownerId=${encodeURIComponent(ownerTaz)}&ownershipDate=${encodeURIComponent(ownershipDate)}&ownerName=${encodeURIComponent('בעל הרכב')}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'EX-API-TOKEN': token,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as any;
    const model = data?.result || data?.data || {};

    // Support both PascalCase CliamsDetails and camelCase cliamsDetails (Tabu API typo)
    const rawClaims = model.CliamsDetails || model.cliamsDetails || model.ClaimsDetails || model.claimsDetails || [];

    const claims = Array.isArray(rawClaims)
      ? rawClaims.map((c: any) => ({
          eventDate: c.EventDate || c.eventDate || '',
          claimType: c.ClaimType || c.claimType || '',
          impairmentRate: Number(c.ImpairmentRate || c.impairmentRate || 0),
          impairmentAmount: Number(c.ImpairmentAmount || c.impairmentAmount || 0),
        }))
      : [];

    return {
      claims,
      ownerAuthenticated: Boolean(model.OwnerAuthenticate ?? model.ownerAuthenticate ?? true),
      rawResponse: model,
    };
  } catch (err) {
    console.error('CheckID Insurance error:', err);
    return null;
  }
}
