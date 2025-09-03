import React, { Suspense, useEffect, useState } from 'react';
import LabelPreview from './LabelPreview';
import type { LabelOptions } from './LabelOptionsPane';
import { loadLabelSettings, applyCssVars, type LabelSettings } from '../labels/formatSettings';
import { generateLabelsPdf } from '../lib/labelsPdf';

const LabelLayoutDialog = React.lazy(() => import('./LabelLayoutDialog'));

type Props = { opts: LabelOptions; cart: any[] };

const PreviewPane: React.FC<Props> = ({ opts, cart }) => {
  const [openLayout, setOpenLayout] = useState(false);
  const [settings, setSettings] = useState<LabelSettings>(() => loadLabelSettings());

  useEffect(() => {
    applyCssVars(settings);
  }, [settings]);

  async function handlePrint() {
    if (cart.length === 0) {
      alert('Keine Artikel im Warenkorb.');
      return;
    }

    try {
      const items = cart.map((item) => ({
        name: item.name,
        price: item.price,
        ean: item.ean,
        articleNumber: item.articleNumber,
        qty: item.qty,
        imageData: item.imageData,
      }));

      await generateLabelsPdf(items, {
        cols: settings.grid.cols,
        rows: settings.grid.rows,
        marginX: settings.page.left,
        marginY: settings.page.top,
        gutterX: settings.gap.col,
        gutterY: settings.gap.row,
        labelW: settings.label.width,
        labelH: settings.label.height,
        barcodeH: settings.barcode.height,
      });
    } catch (err: any) {
      alert(`PDF-Erzeugung fehlgeschlagen: ${err?.message || err}`);
    }
  }

  return (
    <div className="labels-page">
      <div className="toolbar">
        <button type="button" onClick={() => setOpenLayout(true)}>
          Etiketten formatieren
        </button>
        <button className="primary" onClick={handlePrint} type="button">
          PDF-Etiketten erzeugen
        </button>
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
