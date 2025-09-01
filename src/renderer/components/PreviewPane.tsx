import React, { useEffect, useState } from 'react';
import LabelPreview from './LabelPreview';
import LabelLayoutDialog from './LabelLayoutDialog';
import { Button } from '@fluentui/react-components';
import type { LabelOptions } from './LabelOptionsPane';
import { loadLabelSettings, validateA4, applyCssVars } from '../labels/formatSettings';
import { buildLabelSheetHTML } from '../print/LabelSheet';

interface Props {
  opts: LabelOptions;
}

const PreviewPane: React.FC<Props> = ({ opts }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    applyCssVars(loadLabelSettings());
  }, []);
  const generate = async () => {
    const cart = (await window.bridge?.cart?.get?.()) || [];
    if (!cart.length) return;
    const s = loadLabelSettings();
    const err = validateA4(s);
    if (err) {
      alert(err);
      return;
    }
    applyCssVars(s);
    const html = buildLabelSheetHTML({ items: cart, settings: s });
    const res = await window.api.print.labelsToPDF({
      jobName: 'Etiketten',
      html,
      pageSize: 'A4',
      marginsMM: { top: 0, right: 0, bottom: 0, left: 0 },
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
