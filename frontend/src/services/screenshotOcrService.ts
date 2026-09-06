import Tesseract from 'tesseract.js';

export interface ExtractedAdData {
  plate: string | null;
  adPrice: number | null;
  rawText?: string;
  confidence?: number;
}

/**
 * Extracts license plate and asking price from raw OCR text
 */
export function parseAdText(rawText: string): ExtractedAdData {
  if (!rawText) return { plate: null, adPrice: null };

  // 1. Match Israeli license plates:
  // Usually 7 digits (XX-XXX-XX or XXX-XX-XXX) or 8 digits (XXX-XX-XXX)
  // Also matches colon or dot separators like 140:30:003 or 140.30.003
  const platePatterns = [
    /\b(\d{2,3})[-:\s\.](\d{2,3})[-:\s\.](\d{2,3})\b/g,
    /\b(\d{7,8})\b/g,
  ];

  let detectedPlate: string | null = null;
  for (const pattern of platePatterns) {
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const digits = match[0].replace(/\D/g, '');
      if (digits.length === 7 || digits.length === 8) {
        // Exclude Israeli mobile prefixes (05X...)
        if (digits.startsWith('05')) continue;
        detectedPlate = digits;
        break;
      }
    }
    if (detectedPlate) break;
  }

  // 2. Match car asking price:
  // In Yad2, price is often formatted as "75,000 ₪" or "[75,000" or "₪75,000"
  // When a seller dropped the price, Yad2 shows both: old struck price (e.g. 79,000) and new price (75,000)
  let detectedPrice: number | null = null;
  const priceRegex = /(?:₪\s*|[\[\(]?\b)(\d{2,3}(?:,\d{3})+|\d{5,6})\s*(?:₪|ש\"?ח|שח|nw)?/gi;
  const candidates: number[] = [];

  let pMatch;
  while ((pMatch = priceRegex.exec(rawText)) !== null) {
    const cleanNum = Number(pMatch[1].replace(/,/g, ''));
    // Filter out monthly financing (e.g. 793) or tiny amounts, keep car prices >= 15,000
    if (cleanNum >= 15000 && cleanNum <= 1500000) {
      candidates.push(cleanNum);
    }
  }

  if (candidates.length > 0) {
    // If Yad2 shows both old price (e.g. 79,000) and dropped price (e.g. 75,000),
    // the active price is the second candidate or the lower of the two!
    if (candidates.length >= 2 && Math.abs(candidates[0] - candidates[1]) <= 20000) {
      detectedPrice = Math.min(candidates[0], candidates[1]);
    } else {
      // Find candidate ending in 00 or 000
      const rounded = candidates.find((c) => c % 100 === 0);
      detectedPrice = rounded || candidates[0];
    }
  }

  return {
    plate: detectedPlate,
    adPrice: detectedPrice,
    rawText,
  };
}

/**
 * Runs OCR on an image (File or Data URL) and extracts plate and price
 */
export async function extractDataFromScreenshot(
  imageSource: string | File
): Promise<ExtractedAdData> {
  try {
    const result = await Tesseract.recognize(imageSource, 'eng', {
      logger: () => {}, // silent
    });

    const text = result?.data?.text || '';
    const parsed = parseAdText(text);
    return {
      ...parsed,
      confidence: result?.data?.confidence,
    };
  } catch (err) {
    console.warn('Tesseract OCR error:', err);
    return { plate: null, adPrice: null };
  }
}
