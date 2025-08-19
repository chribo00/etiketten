import React, { useState } from 'react';
import { Checkbox } from '@fluentui/react-components';

const LabelOptionsPane: React.FC = () => {
  const [opts, setOpts] = useState({
    showArticleNumber: true,
    showEan: true,
    showShortText: true,
    showListPrice: true,
    showImage: false,
  });
  const toggle = (key: keyof typeof opts) => (_: any, data: any) => setOpts({ ...opts, [key]: data.checked });
  return (
    <div>
      <Checkbox label="Artikelnummer" checked={opts.showArticleNumber} onChange={toggle('showArticleNumber')} />
      <Checkbox label="EAN" checked={opts.showEan} onChange={toggle('showEan')} />
      <Checkbox label="Kurztext" checked={opts.showShortText} onChange={toggle('showShortText')} />
      <Checkbox label="Preis" checked={opts.showListPrice} onChange={toggle('showListPrice')} />
      <Checkbox label="Bild" checked={opts.showImage} onChange={toggle('showImage')} />
    </div>
  );
};

export default LabelOptionsPane;
