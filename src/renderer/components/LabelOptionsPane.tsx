import React from 'react';
import { Checkbox } from '@fluentui/react-components';

export interface LabelOptions {
  showArticleNumber: boolean;
  showEan: boolean;
  showShortText: boolean;
  showListPrice: boolean;
  showImage: boolean;
}

interface Props {
  opts: LabelOptions;
  onChange: (opts: LabelOptions) => void;
}

const LabelOptionsPane: React.FC<Props> = ({ opts, onChange }) => {
  const toggle = (key: keyof LabelOptions) => (_: any, data: any) =>
    onChange({ ...opts, [key]: !!data.checked });
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
