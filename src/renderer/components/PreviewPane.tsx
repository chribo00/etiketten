import React, { Suspense, useEffect, useState } from 'react';
import LabelPreview from './LabelPreview';
import type { LabelOptions } from './LabelOptionsPane';
import { loadLabelSettings, applyCssVars, type LabelSettings } from '../labels/formatSettings';

const LabelLayoutDialog = React.lazy(() => import('./LabelLayoutDialog'));

// kleine Hilfsfunktion: CSS aus global.css (nur relevante Teile)
const PRINT_CSS = `
:root{
  --page-margin-top:8mm;--page-margin-right:8mm;--page-margin-bottom:8mm;--page-margin-left:8mm;
  --grid-column-gap:6mm;--grid-row-gap:6mm;--label-width:63.5mm;--label-height:38.1mm;
  --barcode-height:18mm;--footer-margin-top:6mm;
}
.labels-page,.labels-grid,.etiketten-grid{
  display:grid;
  grid-template-columns:repeat(var(--labels-columns,3),var(--label-width));
  grid-auto-rows:var(--label-height);
  column-gap:var(--grid-column-gap);row-gap:var(--grid-row-gap);
}
.label{display:flex;flex-direction:column;align-items:flex-start;gap:4mm;box-sizing:border-box;
  padding:3mm 2mm;min-height:46mm;break-inside:avoid;page-break-inside:avoid;}
.label__sku,.label__title,.label__price,.label__barcode,.label__image{display:block;width:100%;}
.label__price{font-size:18px;font-weight:bold;margin:4px 0 0 0;line-height:1.4;}
.label__barcode{margin-top:0;margin-bottom:3mm;position:static;overflow:visible;height:var(--barcode-height);}
.label__barcode svg,.label__barcode canvas{display:block;margin:0;position:static;}
.label__image{width:60px;height:60px;background:#ccc;}
.label__footer{margin-top:auto;font-size:10pt;line-height:1.2;white-space:nowrap;}
@media print {
  @page { margin: var(--page-margin-top) var(--page-margin-right) var(--page-margin-bottom) var(--page-margin-left); }
}
`;

// CSS-Variablen als <style> String erzeugen
function cssVarsStyleTag(s: LabelSettings) {
  return `<style id="label-runtime-vars">:root{
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
  }</style>`;
}

type Props = { opts: LabelOptions };

const PreviewPane: React.FC<Props> = ({ opts }) => {
  const [openLayout, setOpenLayout] = useState(false);
  const [settings, setSettings] = useState<LabelSettings>(() => loadLabelSettings());

  useEffect(() => { applyCssVars(settings); }, [settings]);

  const [cart, setCart] = useState<{ articleId: string; qty: number }[]>([]);
  useEffect(() => {
    (async () => {
      const c = (await window.bridge?.cart?.get?.()) || [];
      setCart(c.map((x: any) => ({ articleId: x.articleId, qty: x.qty })));
    })();
  }, []);

  async function getArticle(articleId: string) {
    const a = await window.bridge?.articles?.getById?.(articleId);
    return a || { articleNumber: articleId, name: articleId, price: undefined };
  }

  async function buildLabelsHtml(): Promise<string> {
    let labels = '';
    for (const item of cart) {
      const art = await getArticle(item.articleId);
      for (let i = 0; i < item.qty; i++) {
        labels += `
          <div class="label">
            ${opts.showArticleNumber && art.articleNumber ? `<div class="label__sku">${art.articleNumber}</div>` : ''}
            ${opts.showShortText && art.name ? `<div class="label__title">${art.name}</div>` : ''}
            ${opts.showListPrice && art.price != null ? `<div class="label__price">${Number(art.price).toFixed(2)} €</div>` : ''}
            ${opts.showEan && art.articleNumber ? `
              <div class="label__barcode">
                <svg width="180" height="40"><rect width="180" height="40" fill="#000"/></svg>
              </div>
            ` : ''}
            <div class="label__footer">Elektro Brunner Johann</div>
          </div>`;
      }
    }
    const vars = cssVarsStyleTag(settings);
    return `<!doctype html><html><head><meta charset="utf-8">
      <style>${PRINT_CSS}</style>${vars}
    </head><body><div class="labels-page">${labels}</div></body></html>`;
  }

  async function handlePrint() {
    if (!window?.api?.print?.labelsToPDF) {
      alert('Druck-API nicht verfügbar (preload nicht geladen).');
      return;
    }
    const html = await buildLabelsHtml();
    await window.api.print.labelsToPDF({
      jobName: 'Etiketten',
      html,
      pageSize: 'A4',
      marginsMM: settings.page,
      saveDialog: true,
    });
  }

  return (
    <div className="labels-page">
      <div className="toolbar">
        <button onClick={() => setOpenLayout(true)}>Etiketten formatieren</button>
        <button className="primary" onClick={handlePrint}>PDF-Etiketten erzeugen</button>
      </div>
      <LabelPreview opts={opts} />
      {openLayout && (
        <Suspense fallback={null}>
          <LabelLayoutDialog
            open={openLayout}
            onClose={() => {
              setSettings(loadLabelSettings());
              setOpenLayout(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default PreviewPane;
