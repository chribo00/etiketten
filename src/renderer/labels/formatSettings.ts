export type LabelSettings = {
  page: { top: number; right: number; bottom: number; left: number }; // mm
  gap: { col: number; row: number }; // mm
  label: { width: number; height: number; autoWidth?: boolean; autoHeight?: boolean }; // mm
  grid: { cols: number; rows: number };
  barcode: { height: number }; // mm
};

const KEY = 'labelSettings.v1';

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
  const A4W = 210;
  return (A4W - s.page.left - s.page.right - (s.grid.cols - 1) * s.gap.col) / s.grid.cols;
}

export function maxLabelHeightMm(s: LabelSettings) {
  const A4H = 297;
  return (A4H - s.page.top - s.page.bottom - (s.grid.rows - 1) * s.gap.row) / s.grid.rows;
}

export function normalizeForAuto(s: LabelSettings) {
  if (s.label.autoWidth) s.label.width = Math.floor(maxLabelWidthMm(s) * 100) / 100;
  if (s.label.autoHeight) s.label.height = Math.floor(maxLabelHeightMm(s) * 100) / 100;
}

export function validateA4(s: LabelSettings): string | null {
  const A4W = 210, A4H = 297;
  const usedW = s.page.left + s.page.right + (s.grid.cols * s.label.width) + ((s.grid.cols - 1) * s.gap.col);
  const usedH = s.page.top + s.page.bottom + (s.grid.rows * s.label.height) + ((s.grid.rows - 1) * s.gap.row);

  if (usedW > A4W + 0.01) return `Breite überschreitet A4 (${usedW.toFixed(2)}mm > 210mm)`;
  if (usedH > A4H + 0.01) return `Höhe überschreitet A4 (${usedH.toFixed(2)}mm > 297mm)`;
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
