import JsBarcode from 'jsbarcode';
import type { LabelSettings } from '../labels/formatSettings';

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

export function buildLabelSheetHTML({ items, settings }: { items: Item[]; settings: LabelSettings; }): string {
  const css = `:root{\n  --page-margin-top:${settings.page.top}mm;\n  --page-margin-right:${settings.page.right}mm;\n  --page-margin-bottom:${settings.page.bottom}mm;\n  --page-margin-left:${settings.page.left}mm;\n  --label-width:${settings.label.width}mm;\n  --label-height:${settings.label.height}mm;\n  --grid-column-gap:${settings.gap.col}mm;\n  --grid-row-gap:${settings.gap.row}mm;\n  --labels-columns:${settings.grid.cols};\n  --barcode-height:${settings.barcode.height}mm;\n}\n@page{size:A4;margin:var(--page-margin-top) var(--page-margin-right) var(--page-margin-bottom) var(--page-margin-left);}\nhtml,body{height:100%;}\n.page{box-sizing:border-box;width:210mm;min-height:297mm;}\n.sheet{display:grid;grid-template-columns:repeat(var(--labels-columns),var(--label-width));grid-auto-rows:var(--label-height);column-gap:var(--grid-column-gap);row-gap:var(--grid-row-gap);}\n.label{box-sizing:border-box;width:var(--label-width);height:var(--label-height);overflow:hidden;}\n.barcode{height:var(--barcode-height);}\n.barcode svg{width:100%;height:var(--barcode-height);}\n.price{font-weight:bold;}`;

  const perPage = settings.grid.cols * settings.grid.rows;
  const pages: string[] = [];
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  for (let p = 0; p < totalPages; p++) {
    const slice = items.slice(p * perPage, (p + 1) * perPage);
    while (slice.length < perPage) slice.push({});
    const labels = slice
      .map(it => {
        const barcode = it.articleNumber ? `<div class="barcode">${renderBarcodeSvg(it.articleNumber, settings.barcode.height)}</div>` : '';
        const price = it.price != null ? `<div class="price">${it.price.toFixed(2)} €</div>` : '';
        return `<div class="label"><div>${it.articleNumber || ''}</div><div>${it.name || ''}</div>${price}${barcode}</div>`;
      })
      .join('');
    pages.push(`<div class="page"><div class="sheet">${labels}</div></div>`);
  }

  return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${pages.join('')}</body></html>`;
}
