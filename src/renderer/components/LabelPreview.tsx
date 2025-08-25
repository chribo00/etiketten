import React from 'react';
import type { LabelOptions } from './LabelOptionsPane';

interface Props {
  opts: LabelOptions;
}

const LabelPreview: React.FC<Props> = ({ opts }) => {
  return (
    <div className="label">
      {opts.showArticleNumber && <div className="label__sku">Art.-Nr: 12345</div>}
      {opts.showShortText && <div className="label__title">Beispieltext</div>}
      {opts.showListPrice && <div className="label__price">9,99 €</div>}
      {opts.showImage && <div className="label__image" />}
      {opts.showEan && (
        <div className="label__barcode">
          <svg width="120" height="40">
            <rect width="120" height="40" fill="#000" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LabelPreview;
