export interface LayoutSettings {
  pageMargin: { top: number; right: number; bottom: number; left: number }; // mm
  spacing: { horizontal: number; vertical: number }; // mm
  labelSize: { width: number; height: number }; // mm
  grid: { columns: number; rows: number };
  barcodeHeightMM: number; // mm
}
