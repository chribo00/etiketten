import React from 'react';
import LabelPreview from './LabelPreview';
import { Button } from '@fluentui/react-components';
import type { LabelOptions } from './LabelOptionsPane';

interface Props {
  opts: LabelOptions;
}

const PreviewPane: React.FC<Props> = ({ opts }) => {
  const generate = async () => {
    const cart = (await window.api?.cart?.get?.()) || [];
    if (!cart.length) return;
    const res = await window.api?.labels?.generate?.();
    if (!res) return;
    alert(`PDF gespeichert unter ${res.pdfPath}`);
    await window.api?.shell?.open?.(res.pdfPath);
  };
  return (
    <div>
      <LabelPreview opts={opts} />
      <Button onClick={generate}>PDF erzeugen</Button>
    </div>
  );
};

export default PreviewPane;
