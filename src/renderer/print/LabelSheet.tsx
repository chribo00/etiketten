import JsBarcode from 'jsbarcode';

export type LayoutSettings = {
  pageMargin: { top: number; right: number; bottom: number; left: number };
  labelSize: { width: number; height: number };
  spacing: { horizontal: number; vertical: number };
  columns: number;
  rows: number;
};

type Item = {
  articleNumber?: string;
  ean?: string;
  name?: string;
  price?: number;
};

function renderBarcodeSvg(code: string, heightMM: number): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, code, { format: 'CODE128', displayValue: false, margin: 0, height: heightMM });
  return svg.outerHTML;
}

export function buildLabelSheetHTML(input: {
  items: Item[];
  layout: LayoutSettings;
  barcodeHeightMM: number;
  fontFamily?: string;
}): string {
  const { items, layout, barcodeHeightMM, fontFamily } = input;
  const css = `@page { size: A4; margin: 0; }
  body { margin:0; font-family:${fontFamily || 'sans-serif'}; }
  .page { padding:${layout.pageMargin.top}mm ${layout.pageMargin.right}mm ${layout.pageMargin.bottom}mm ${layout.pageMargin.left}mm; }
  .grid { display:grid; grid-template-columns: repeat(${layout.columns}, ${layout.labelSize.width}mm); grid-auto-rows:${layout.labelSize.height}mm; grid-column-gap:${layout.spacing.horizontal}mm; grid-row-gap:${layout.spacing.vertical}mm; }
  .label { box-sizing:border-box; overflow:hidden; }
  .barcode svg{ width:100%; height:${barcodeHeightMM}mm; }
  .price{ font-weight:bold; }`;

  const labelsHtml = items.map(it => {
    const barcode = it.articleNumber ? `<div class="barcode">${renderBarcodeSvg(it.articleNumber, barcodeHeightMM)}</div>` : '';
    const price = it.price != null ? `<div class="price">${it.price.toFixed(2)} €</div>` : '';
    return `<div class="label"><div>${it.articleNumber || ''}</div><div>${it.name || ''}</div>${price}${barcode}</div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body><div class="page"><div class="grid">${labelsHtml}</div></div></body></html>`;
}

