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

  if (combined.includes('jimny') || combined.includes("ג'ימני") || combined.includes('גימני')) {
    return {
      src: `/assets/cars/suzuki-jimny/${colorKey}.png`,
      plateBottomPct: '22%',
      plateScale: 0.85,
      modelId: 'suzuki-jimny',
      isBlack,
    };
  }

  if (combined.includes('picanto') || combined.includes('פיקנטו')) {
    return {
      src: `/assets/cars/kia-picanto/${colorKey}.png`,
      plateBottomPct: '26%',
      plateScale: 0.82,
      modelId: 'kia-picanto',
      isBlack,
    };
  }

  if (combined.includes('tucson') || combined.includes('טוסון')) {
    return {
      src: `/assets/cars/hyundai-tucson/${colorKey}.png`,
      plateBottomPct: '27%',
      plateScale: 0.86,
      modelId: 'hyundai-tucson',
      isBlack,
    };
  }

  // Default fallback: Kia Sportage (Israel's #1 popular family SUV)
  return {
    src: `/assets/cars/kia-sportage/${colorKey}.png`,
    plateBottomPct: '27.5%',
    plateScale: 0.88,
    modelId: 'kia-sportage',
    isBlack,
  };
}
