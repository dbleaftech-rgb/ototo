/**
 * carNames.ts - Canonical vehicle naming & normalization for Ototo
 * Ported and modernized from CANON & car_names.py
 */

const COUNTRY_TOKENS = [
  'ארהב', 'ארה', 'גרמניה', 'יפן', 'קוריאה', 'סין', 'צכיה', 'צכ', 'סלובקיה', 'ספרד', 'צרפת',
  'איטליה', 'טורקיה', 'הודו', 'מרוקו', 'רומניה', 'מכסיקו', 'מקסיקו', 'פורטוגל', 'קנדה', 'בריטניה',
  'אנגליה', 'הונגריה', 'בלגיה', 'שבדיה', 'פולין', 'סלובניה', 'אוסטריה', 'הולנד', 'ברזיל', 'תאילנד',
  'ויאטנם', 'אינדונזיה', 'טיוואן', 'רוסיה', 'אוקראינה', 'אוזבקיסטן', 'ארגנטינה', 'שוויץ', 'פינלנד',
  'דרום', 'אפריקה'
];

const MAKE_EN: Record<string, string> = {
  'קיה': 'KIA', 'יונדאי': 'HYUNDAI', 'יונדאיי': 'HYUNDAI', 'טויוטה': 'TOYOTA',
  'מאזדה': 'MAZDA', 'מזדה': 'MAZDA', 'סקודה': 'SKODA', 'שקודה': 'SKODA', 'פולקסווגן': 'VOLKSWAGEN',
  'פולקסוואגן': 'VOLKSWAGEN', 'ניסאן': 'NISSAN', 'ניסן': 'NISSAN', 'מיצובישי': 'MITSUBISHI',
  'סוזוקי': 'SUZUKI', 'הונדה': 'HONDA', 'פורד': 'FORD', 'שברולט': 'CHEVROLET', 'אופל': 'OPEL',
  'פיאט': 'FIAT', 'פיגו': 'PEUGEOT', 'פיזו': 'PEUGEOT', 'רנו': 'RENAULT', 'רנומגאן': 'RENAULT',
  'סיטרואן': 'CITROEN', 'סובארו': 'SUBARU', 'במוו': 'BMW', 'במו': 'BMW',
  'מרצדס': 'MERCEDES-BENZ', 'מרצדסבנץ': 'MERCEDES-BENZ', 'אאודי': 'AUDI', 'אודי': 'AUDI',
  'וולוו': 'VOLVO', 'וולבו': 'VOLVO', 'לקסוס': 'LEXUS', 'סיאט': 'SEAT', 'קופרה': 'CUPRA',
  'דאציה': 'DACIA', 'אלפארומיאו': 'ALFA ROMEO', 'אלפא': 'ALFA ROMEO',
  'טסלה': 'TESLA', 'טסלהמוטורס': 'TESLA', 'יגואר': 'JAGUAR', 'לנדרובר': 'LAND ROVER',
  'לנד': 'LAND ROVER', 'מיני': 'MINI', 'פורשה': 'PORSCHE', 'קרייזלר': 'CHRYSLER', 'גיפ': 'JEEP',
  'זיפ': 'JEEP', 'דודג': 'DODGE', 'איסוזו': 'ISUZU', 'דייהו': 'DAEWOO', 'דייהטסו': 'DAIHATSU',
  'סאנגיונג': 'KGM', 'סנגיונג': 'KGM', 'קיגיאם': 'KGM', 'קיי גי מוביליט': 'KGM',
  'אינפיניטי': 'INFINITI', 'צרי': 'CHERY', 'מג': 'MG', 'אמגי': 'MG', 'אמגיי': 'MG',
  'ביוויד': 'BYD', 'ביווידי': 'BYD', 'בידי': 'BYD', 'אורה': 'ORA', 'גילי': 'GEELY',
  'גיאומטרי': 'GEOMETRY', 'דונגפנג': 'DONGFENG', 'גיאיסי': 'GAC', 'ליפמוטור': 'LEAPMOTOR',
  'פולסטאר': 'POLESTAR', 'סקייוול': 'SKYWELL', 'וויאט': 'VOYAH', 'דיאס': 'DS', 'דס': 'DS',
  'לינקאנדקו': 'LYNK & CO', 'סמארט': 'SMART', 'סאאב': 'SAAB', 'גאק': 'JAC', 'זאק': 'JAC',
  'רובר': 'LAND ROVER', 'קאדילק': 'CADILLAC', 'קדילק': 'CADILLAC',
};

const bare = (s: string | null | undefined): string => String(s || '').replace(/["'׳״.\-]/g, '');
const nrm = (s: string | null | undefined): string => String(s || '').replace(/["'׳״`.\-\/\s]/g, '');
const upEn = (s: string | null | undefined): string => String(s || '').trim().toUpperCase().replace(/\s+/g, ' ');
const lat = (s: string | null | undefined): string => String(s || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const MAKE_EN_N: Record<string, string> = {};
for (const k in MAKE_EN) {
  MAKE_EN_N[nrm(k)] = MAKE_EN[k];
}

export function makeHeOf(raw: string | null | undefined): string {
  const toks = String(raw || '').trim().split(/[\s\-]+/).filter(Boolean);
  while (toks.length > 1) {
    const t = bare(toks[toks.length - 1]);
    if (t.length >= 3 && COUNTRY_TOKENS.some(c => c.indexOf(t) === 0)) {
      toks.pop();
      continue;
    }
    break;
  }
  const full = toks.join(' ').replace(/[{}"\\]/g, '');
  const parts = full.split(' ').filter(Boolean);
  for (let n = parts.length; n >= 1; n--) {
    const cand = parts.slice(0, n).join(' ');
    if (MAKE_EN_N[nrm(cand)]) return cand;
  }
  return full;
}

export function makeEnOf(he: string | null | undefined): string {
  const m = String(he || '').trim();
  if (!m) return '';
  if (/[A-Za-z]/.test(m)) return upEn(m);
  const n = nrm(m);
  return MAKE_EN_N[n] || MAKE_EN_N[nrm(m.split(/\s+/)[0])] || '';
}

export function makeNormOf(s: string | null | undefined): string {
  return String(s || '')
    .replace(/['"׳״`.\-\s]/g, '')
    .replace(/יא/g, 'א')
    .replace(/א/g, '')
    .replace(/ג/g, 'ז');
}

export const MODEL_SUBS: [string, string][] = [
  ["ג'", 'ז'], ['ג׳', 'ז'], ["'", ''], ['׳', ''], ['"', ''], ['״', ''],
  ['`', ''], ['-', ''], [' ', ''], ['יי', 'י'], ['יא', 'א'], ['א', '']
];

export function modelNormOf(s: string | null | undefined): string {
  let x = String(s == null ? '' : s);
  for (let i = 0; i < MODEL_SUBS.length; i++) {
    x = x.split(MODEL_SUBS[i][0]).join(MODEL_SUBS[i][1]);
  }
  return x;
}

const PARENT: Array<{ mk: RegExp; kn: RegExp; he: string; en: string }> = [
  {
    mk: /קרייזלר|CHRYSLER/i,
    kn: /^(JEEP[ \-]+)?(WRANGLER|GRAND CHEROKEE|CHEROKEE|COMPASS|RENEGADE|COMMANDER|GLADIATOR|PATRIOT|LIBERTY|AVENGER)\b/i,
    he: "ג'יפ",
    en: 'JEEP'
  },
  {
    mk: /ב ?מ ?וו|BMW/i,
    kn: /^(MINI[ \-]+)?(COOPER|COUNTRYMAN|CLUBMAN|CABRIO|CONVERTIBLE|PACEMAN|ONE\b|JCW|JOHN[ \-]?COOPER)/i,
    he: 'מיני',
    en: 'MINI'
  }
];

export function brandOf(tozeret: string | null | undefined, kinuy: string | null | undefined): { he: string; en: string } {
  let he = makeHeOf(tozeret);
  let en = makeEnOf(he);
  const k = String(kinuy || '').trim();
  for (let i = 0; i < PARENT.length; i++) {
    const p = PARENT[i];
    if (p.mk.test(he) && p.kn.test(k)) {
      he = p.he;
      en = p.en;
      break;
    }
  }
  return { he, en };
}

const LINE_RULES: Array<{ mk: RegExp; kn: RegExp; he: string; en: string }> = [
  { mk: /ב ?מ ?וו|BMW/i, kn: /^([1-8])\d\d/, he: 'סדרה $1', en: '$1 SERIES' },
  { mk: /מרצדס|MERCEDES/i, kn: /^([ABCES])[ -]?\d{2,3}/, he: '$1-קלאס', en: '$1-CLASS' }
];

export function lineOf(he: string, en: string, kinuy: string): { he: string; en: string; fired: boolean } {
  const mk = String(he || '') + ' ' + String(en || '');
  for (let i = 0; i < LINE_RULES.length; i++) {
    const r = LINE_RULES[i];
    if (!r.mk.test(mk)) continue;
    const m = r.kn.exec(kinuy);
    if (!m) continue;
    return {
      he: r.he.replace(/\$1/g, m[1]),
      en: r.en.replace(/\$1/g, m[1]),
      fired: true
    };
  }
  return { he: kinuy, en: kinuy, fired: false };
}

export function dropMakeToken(line: string, en: string, he: string): string {
  const t = String(line || '').trim().split(/\s+/).filter(Boolean);
  if (t.length < 2) return line;
  const head = lat(t[0]);
  if (head && (head === lat(en) || head === lat(he))) return t.slice(1).join(' ');
  return line;
}

export function trimOf(raw: string | null | undefined, kinuy: string | null | undefined): string {
  const k = lat(kinuy);
  return String(raw || '').trim().split(/\s+/).filter(Boolean).filter((t) => {
    const n = lat(t);
    if (!n || !k) return true;
    if (n === k) return false;
    return !(n.length >= 3 && (k.indexOf(n) >= 0 || n.indexOf(k) >= 0));
  }).join(' ');
}

export interface VehicleMetaResult {
  make: string;
  makeEn: string;
  model: string;
  modelLine: string;
  modelLineHe: string;
  lineRule: boolean;
  trim: string;
  subModel: string;
  year: number | null;
  vehicleTitle: string;
}

export function computeVehicleMeta(reg: {
  tozeret_nm?: string;
  kinuy_mishari?: string;
  ramat_gimur?: string;
  shnat_yitzur?: string | number;
}): VehicleMetaResult {
  const kinuy = String(reg.kinuy_mishari || '').trim();
  const b = brandOf(reg.tozeret_nm, kinuy);
  const he = b.he;
  const en = b.en;
  const ln = lineOf(he, en, upEn(kinuy));
  if (!ln.fired) {
    ln.en = dropMakeToken(ln.en, en, he);
    ln.he = dropMakeToken(ln.he, en, he);
  }
  const trim = trimOf(reg.ramat_gimur, kinuy);
  const subModel = ln.fired ? [trim, upEn(kinuy)].filter(Boolean).join(' ') : trim;
  const year = Number(reg.shnat_yitzur) || null;
  return {
    make: he,
    makeEn: en,
    model: kinuy,
    modelLine: ln.en,
    modelLineHe: ln.he,
    lineRule: ln.fired,
    trim,
    subModel,
    year,
    vehicleTitle: [en || he, ln.en, year ? String(year) : ''].filter(Boolean).join(' ')
  };
}
