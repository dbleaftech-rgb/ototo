export interface CarAssetParams {
  make?: string;
  model?: string;
  color?: string;
}

export interface CarAssetResult {
  src: string;
  plateBottomPct: string;
  plateScale: number;
  modelId: string;
  isBlack: boolean;
  isGeneric?: boolean;
}

export function resolveCarAsset(params: CarAssetParams): CarAssetResult {
  const { make = '', model = '', color = '' } = params;
  const combined = `${make} ${model}`.toLowerCase();
  const colorStr = (color || '').toLowerCase();
  const isBlack =
    colorStr.includes('שחור') ||
    colorStr.includes('black') ||
    colorStr.includes('כהה');

  const colorKey = isBlack ? 'black' : 'white';

  // 1. Suzuki Jimny
  if (combined.includes('jimny') || combined.includes("ג'ימני") || combined.includes('גימני')) {
    return {
      src: `/assets/cars/suzuki-jimny/${colorKey}.png`,
      plateBottomPct: '22%',
      plateScale: 0.85,
      modelId: 'suzuki-jimny',
      isBlack,
      isGeneric: false,
    };
  }

  // 2. Opel Mokka
  if (combined.includes('mokka') || combined.includes('מוקה') || combined.includes('opel') || combined.includes('אופל')) {
    return {
      src: `/assets/cars/opel-mokka/${colorKey}.png?v=4`,
      plateBottomPct: '26.8%',
      plateScale: 0.84,
      modelId: 'opel-mokka',
      isBlack,
      isGeneric: false,
    };
  }

  // 3. Kia Picanto
  if (combined.includes('picanto') || combined.includes('פיקנטו')) {
    return {
      src: `/assets/cars/kia-picanto/${colorKey}.png`,
      plateBottomPct: '26%',
      plateScale: 0.82,
      modelId: 'kia-picanto',
      isBlack,
      isGeneric: false,
    };
  }

  // 4. Hyundai Tucson
  if (combined.includes('tucson') || combined.includes('טוסון')) {
    return {
      src: `/assets/cars/hyundai-tucson/${colorKey}.png`,
      plateBottomPct: '27%',
      plateScale: 0.86,
      modelId: 'hyundai-tucson',
      isBlack,
      isGeneric: false,
    };
  }

  // 5. Kia Sportage
  if (combined.includes('sportage') || combined.includes('ספורטאז')) {
    return {
      src: `/assets/cars/kia-sportage/${colorKey}.png`,
      plateBottomPct: '27.5%',
      plateScale: 0.88,
      modelId: 'kia-sportage',
      isBlack,
      isGeneric: false,
    };
  }

  // 6. Unknown / Uncatalogued model: Neutral sleek automotive silhouette (NEVER show wrong competitor brand!)
  return {
    src: `/assets/cars/generic/silhouette.svg`,
    plateBottomPct: '25%',
    plateScale: 0.88,
    modelId: 'generic-silhouette',
    isBlack,
    isGeneric: true,
  };
}
