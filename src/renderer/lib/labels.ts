import JsBarcode from 'jsbarcode';

export const mmToPx = (mm: number, dpi = 300) => Math.round(mm * (dpi / 25.4));
export const mmToPt = (mm: number) => (mm * 72) / 25.4;

export const onlyDigits = (str: string): string => str.replace(/\D/g, '');

export const eanChecksum12 = (d12: string): number => {
  const digits = d12.split('').map((d) => parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digits[i] * weight;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
};

export const isValidEan13 = (ean: string): boolean => {
  const digits = onlyDigits(ean);
  if (digits.length !== 13) return false;
  const check = eanChecksum12(digits.slice(0, 12));
  return check === parseInt(digits[12], 10);
};

export const fromArticleToEan13 = (artnr: string): string | null => {
  const trimmed = artnr.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const d12 =
    trimmed.length >= 12 ? trimmed.slice(-12) : trimmed.padStart(12, '0');
  const check = eanChecksum12(d12);
  return `${d12}${check}`;
};

export async function renderBarcodePng(
  artnr: string,
  widthMm: number,
  heightMm: number,
  dpi = 300
): Promise<string> {
  const pxW = mmToPx(widthMm, dpi);
  const pxH = mmToPx(heightMm, dpi);
  const canvas = document.createElement('canvas');
  canvas.width = pxW;
  canvas.height = pxH;

  const trimmed = artnr.trim();
  let format: 'EAN13' | 'CODE128' = 'CODE128';
  let code = trimmed;

  if (/^\d{13}$/.test(trimmed)) {
    const d12 = trimmed.slice(0, 12);
    const check = eanChecksum12(d12);
    code = `${d12}${check}`;
    format = 'EAN13';
  }

  const opts: any = {
    format,
    lineColor: '#000',
    background: '#fff',
    width: Math.max(1, Math.floor(pxW / 180)),
    height: Math.max(30, Math.floor(pxH * 0.65)),
    displayValue: true,
    text: trimmed,
    font: 'Helvetica',
    fontSize: 14,
    textMargin: 4,
    textAlign: 'center',
    margin: 10,
    marginTop: 0,
    marginBottom: 0,
  };

  JsBarcode(canvas, code, opts);
  return canvas.toDataURL('image/png');
}

export type LabelConfig = {
  page: 'a4' | [number, number];
  cols: number;
  rows: number;
  marginX: number;
  marginY: number;
  gutterX: number;
  gutterY: number;
  labelW: number;
  labelH: number;
  barcodeH: number;
};

export const A4_3x8: LabelConfig = {
  page: 'a4',
  cols: 3,
  rows: 8,
  marginX: 10,
  marginY: 10,
  gutterX: 4,
  gutterY: 3,
  labelW: 63.5,
  labelH: 38.1,
  barcodeH: 18,
};

