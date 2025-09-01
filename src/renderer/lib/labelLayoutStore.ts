import type { LayoutSettings } from '../../shared/layout';

export const defaultLayout: LayoutSettings = {
  pageMargin: { top: 8, right: 8, bottom: 8, left: 8 },
  labelSize: { width: 70, height: 37 },
  spacing: { horizontal: 4, vertical: 8 },
  grid: { columns: 3, rows: 8 },
  barcodeHeightMM: 18,
};

const PAGE_W = 210; // A4 portrait
export function maxLabelWidthMm(
  cols: number,
  gapH: number,
  mLeft: number,
  mRight: number,
): number {
  return (PAGE_W - (mLeft + mRight) - (cols - 1) * gapH) / cols;
}

function num(val: any, min: number, max: number): number {
  const n = parseFloat(String(val).replace(',', '.'));
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function int(val: any, min: number, max: number): number {
  return Math.round(num(val, min, max));
}

export function sanitizeLayout(input: any): LayoutSettings {
  return {
    pageMargin: {
      top: num(input?.pageMargin?.top, 0, 25),
      right: num(input?.pageMargin?.right, 0, 25),
      bottom: num(input?.pageMargin?.bottom, 0, 25),
      left: num(input?.pageMargin?.left, 0, 25),
    },
    spacing: {
      horizontal: num(input?.spacing?.horizontal, 0, 50),
      vertical: num(input?.spacing?.vertical, 0, 50),
    },
    labelSize: {
      width: num(input?.labelSize?.width, 1, 210),
      height: num(input?.labelSize?.height, 1, 297),
    },
    grid: {
      columns: int(input?.grid?.columns, 1, 20),
      rows: int(input?.grid?.rows, 1, 20),
    },
    barcodeHeightMM: num(input?.barcodeHeightMM, 1, 200),
  };
}

export function validateLayout(l: LayoutSettings): string | null {
  const maxW = maxLabelWidthMm(
    l.grid.columns,
    l.spacing.horizontal,
    l.pageMargin.left,
    l.pageMargin.right,
  );
  if (l.labelSize.width > maxW) {
    return `Breite überschreitet A4.\nMaximal möglich: ${maxW.toFixed(2)} mm\n(bei ${l.grid.columns} Spalten, horizontalem Abstand ${l.spacing.horizontal} mm, Rändern L/R ${l.pageMargin.left}/${l.pageMargin.right} mm)`;
  }
  const totalH =
    l.grid.rows * l.labelSize.height +
    (l.grid.rows - 1) * l.spacing.vertical +
    l.pageMargin.top + l.pageMargin.bottom;
  if (totalH > 297) return 'Höhe überschreitet A4';
  return null;
}

export async function loadLayout(): Promise<LayoutSettings> {
  const data = (await window.api.settings.getAll()) as any;
  const merged = {
    pageMargin: { ...defaultLayout.pageMargin, ...(data.pageMargin || {}) },
    spacing: { ...defaultLayout.spacing, ...(data.spacing || {}) },
    labelSize: { ...defaultLayout.labelSize, ...(data.labelSize || {}) },
    grid: { ...defaultLayout.grid, ...(data.grid || {}) },
    barcodeHeightMM: data.barcodeHeightMM ?? defaultLayout.barcodeHeightMM,
  };
  return sanitizeLayout(merged);
}

export async function applyLayoutCssVariables(layout?: LayoutSettings): Promise<void> {
  const s = layout ?? (await loadLayout());
  const r = document.documentElement;
  r.style.setProperty('--page-margin-top', `${s.pageMargin.top}mm`);
  r.style.setProperty('--page-margin-right', `${s.pageMargin.right}mm`);
  r.style.setProperty('--page-margin-bottom', `${s.pageMargin.bottom}mm`);
  r.style.setProperty('--page-margin-left', `${s.pageMargin.left}mm`);
  r.style.setProperty('--label-w', `${s.labelSize.width}mm`);
  r.style.setProperty('--label-h', `${s.labelSize.height}mm`);
  r.style.setProperty('--gap-x', `${s.spacing.horizontal}mm`);
  r.style.setProperty('--gap-y', `${s.spacing.vertical}mm`);
  r.style.setProperty('--cols', String(s.grid.columns));
  r.style.setProperty('--rows', String(s.grid.rows));
  r.style.setProperty('--barcode-h', `${s.barcodeHeightMM}mm`);
}
