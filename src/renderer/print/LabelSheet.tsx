import JsBarcode from 'jsbarcode';
import type { LayoutSettings } from '../../shared/layout';

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

export function buildLabelSheetHTML({ items, layout }: { items: Item[]; layout: LayoutSettings; }): string {
  const css = `:root{\n  --page-margin-top:${layout.pageMargin.top}mm;\n  --page-margin-right:${layout.pageMargin.right}mm;\n  --page-margin-bottom:${layout.pageMargin.bottom}mm;\n  --page-margin-left:${layout.pageMargin.left}mm;\n  --label-w:${layout.labelSize.width}mm;\n  --label-h:${layout.labelSize.height}mm;\n  --gap-x:${layout.spacing.horizontal}mm;\n  --gap-y:${layout.spacing.vertical}mm;\n  --cols:${layout.grid.columns};\n  --rows:${layout.grid.rows};\n  --barcode-h:${layout.barcodeHeightMM}mm;\n}\n@page{size:A4;margin:0;}\nhtml,body{height:100%;}\n.page{box-sizing:border-box;padding:var(--page-margin-top) var(--page-margin-right) var(--page-margin-bottom) var(--page-margin-left);width:210mm;min-height:297mm;}\n.sheet{display:grid;grid-template-columns:repeat(var(--cols),var(--label-w));grid-template-rows:repeat(var(--rows),var(--label-h));column-gap:var(--gap-x);row-gap:var(--gap-y);}\n.label{box-sizing:border-box;width:var(--label-w);height:var(--label-h);overflow:hidden;}\n.barcode{height:var(--barcode-h);}\n.barcode svg{width:100%;height:var(--barcode-h);}\n.price{font-weight:bold;}`;

  const perPage = layout.grid.columns * layout.grid.rows;
  const pages: string[] = [];
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  for (let p = 0; p < totalPages; p++) {
    const slice = items.slice(p * perPage, (p + 1) * perPage);
    while (slice.length < perPage) slice.push({});
    const labels = slice
      .map(it => {
        const barcode = it.articleNumber ? `<div class="barcode">${renderBarcodeSvg(it.articleNumber, layout.barcodeHeightMM)}</div>` : '';
        const price = it.price != null ? `<div class="price">${it.price.toFixed(2)} €</div>` : '';
        return `<div class="label"><div>${it.articleNumber || ''}</div><div>${it.name || ''}</div>${price}${barcode}</div>`;
      })
      .join('');
    pages.push(`<div class="page"><div class="sheet">${labels}</div></div>`);
  }

  return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${pages.join('')}</body></html>`;
}
