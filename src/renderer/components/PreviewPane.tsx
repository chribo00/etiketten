import React, { useEffect, useState } from 'react';
import LabelPreview from './LabelPreview';
import LabelLayoutDialog from './LabelLayoutDialog';
import { Button } from '@fluentui/react-components';
import type { LabelOptions } from './LabelOptionsPane';
import { applyLayoutCssVariables, loadLayout } from '../lib/labelLayoutStore';
import { buildLabelSheetHTML } from '../print/LabelSheet';

interface Props {
  opts: LabelOptions;
}

const PreviewPane: React.FC<Props> = ({ opts }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    void applyLayoutCssVariables();
  }, []);
  const generate = async () => {
    const cart = (await window.bridge?.cart?.get?.()) || [];
    if (!cart.length) return;
    const layout = await loadLayout();
    const html = buildLabelSheetHTML({ items: cart, layout, barcodeHeightMM: layout.barcodeHeightMM ?? 18 });
    const res = await window.api.print.labelsToPDF({
      jobName: 'Etiketten',
      html,
      pageSize: 'A4',
      marginsMM: layout.pageMargin,
      saveDialog: true,
      defaultPath: 'etiketten.pdf',
    });
    if (!res.ok) {
      alert(`PDF-Fehler: ${res.error}`);
    }
  };
  return (
    <div className="labels-page">
      <div className="toolbar">
        <button onClick={() => setOpen(true)}>Etiketten formatieren</button>
        <Button onClick={generate}>Etiketten erzeugen</Button>
      </div>
      <div className="labels-grid">
        <LabelPreview opts={opts} />
      </div>
      <LabelLayoutDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default PreviewPane;
