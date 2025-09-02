export type LabelSettings = {
  page: { top: number; right: number; bottom: number; left: number }; // mm
  gap: { col: number; row: number }; // mm
  label: { width: number; height: number; autoWidth?: boolean; autoHeight?: boolean }; // mm
  grid: { cols: number; rows: number };
  barcode: { height: number }; // mm
};

const KEY = 'labelSettings.v1';

export const A4W = 210;
export const A4H = 297;

export const deNumber = (v: string | number): number =>
  typeof v === 'number' ? v : parseFloat(String(v).trim().replace(',', '.'));

export function loadLabelSettings(): LabelSettings {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  // Defaults (Avery 3x8 63.5x38.1)
  return {
    page: { top: 8, right: 8, bottom: 8, left: 8 },
    gap: { col: 6, row: 6 },
    label: { width: 63.5, height: 38.1 },
    grid: { cols: 3, rows: 8 },
    barcode: { height: 18 },
  };
}

export function saveLabelSettings(s: LabelSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function maxLabelWidthMm(s: LabelSettings) {
  return (A4W - s.page.left - s.page.right - (s.grid.cols - 1) * s.gap.col) / s.grid.cols;
}

export function maxLabelHeightMm(s: LabelSettings) {
  return (A4H - s.page.top - s.page.bottom - (s.grid.rows - 1) * s.gap.row) / s.grid.rows;
}

export function normalizeFromForm(s: LabelSettings) {
  // stelle sicher, dass alles Zahlen sind – de-Format „63,5“
  s.page.top = deNumber(s.page.top);
  s.page.bottom = deNumber(s.page.bottom);
  s.page.left = deNumber(s.page.left);
  s.page.right = deNumber(s.page.right);
  s.gap.col = deNumber(s.gap.col);
  s.gap.row = deNumber(s.gap.row);
  s.grid.cols = Number(s.grid.cols);
  s.grid.rows = Number(s.grid.rows);
  s.label.width = deNumber(s.label.width);
  s.label.height = deNumber(s.label.height);
}

export function clampToPage(s: LabelSettings): { clampedW?: number; clampedH?: number } {
  const maxW = maxLabelWidthMm(s);
  const maxH = maxLabelHeightMm(s);
  const info: { clampedW?: number; clampedH?: number } = {};
  if (s.label.width > maxW) {
    s.label.width = Math.floor(maxW * 100) / 100;
    info.clampedW = s.label.width;
  }
  if (s.label.height > maxH) {
    s.label.height = Math.floor(maxH * 100) / 100;
    info.clampedH = s.label.height;
  }
  return info;
}

export function validateA4(s: LabelSettings): string | null {
  const totalW =
    s.page.left +
    s.page.right +
    s.grid.cols * s.label.width +
    (s.grid.cols - 1) * s.gap.col;
  const totalH =
    s.page.top +
    s.page.bottom +
    s.grid.rows * s.label.height +
    (s.grid.rows - 1) * s.gap.row;
  if (totalW > A4W + 1e-6) return `Breite überschreitet A4 (${totalW.toFixed(2)}mm > ${A4W}mm)`;
  if (totalH > A4H + 1e-6) return `Höhe überschreitet A4 (${totalH.toFixed(2)}mm > ${A4H}mm)`;
  return null;
}

export function applyCssVars(s: LabelSettings) {
  const elId = 'label-runtime-vars';
  const style = (document.getElementById(elId) as HTMLStyleElement | null) ?? document.createElement('style');
  style.id = elId;

  const css = `
  :root{
    --page-margin-top:${s.page.top}mm;
    --page-margin-right:${s.page.right}mm;
    --page-margin-bottom:${s.page.bottom}mm;
    --page-margin-left:${s.page.left}mm;

    --grid-column-gap:${s.gap.col}mm;
    --grid-row-gap:${s.gap.row}mm;

    --label-width:${s.label.width}mm;
    --label-height:${s.label.height}mm;

    --barcode-height:${s.barcode.height}mm;
    --labels-columns:${s.grid.cols};
  }`;

  style.textContent = css;
  if (!style.parentNode) document.head.appendChild(style);
}
