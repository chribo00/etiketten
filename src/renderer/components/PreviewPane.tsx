import React, { useEffect, useState } from 'react';
import LabelPreview from './LabelPreview';
import LabelLayoutDialog from './LabelLayoutDialog';
import { Button } from '@fluentui/react-components';
import type { LabelOptions } from './LabelOptionsPane';
import { applyLayoutCssVariables } from '../lib/labelLayoutStore';

interface Props {
  opts: LabelOptions;
}

const PreviewPane: React.FC<Props> = ({ opts }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    applyLayoutCssVariables();
  }, []);
  const generate = async () => {
    const cart = (await window.bridge?.cart?.get?.()) || [];
    if (!cart.length) return;
    const res = await window.bridge?.labels?.generate?.();
    if (!res) return;
    alert(`PDF gespeichert unter ${res.pdfPath}`);
    await window.bridge?.shell?.open?.(res.pdfPath);
  };
  return (
    <div className="labels-page">
      <div className="toolbar">
        <button onClick={() => setOpen(true)}>Etiketten formatieren</button>
        <Button onClick={generate}>PDF erzeugen</Button>
      </div>
      <div className="labels-grid">
        <LabelPreview opts={opts} />
      </div>
      <LabelLayoutDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default PreviewPane;
