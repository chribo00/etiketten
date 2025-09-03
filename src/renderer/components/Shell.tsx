import React, { useState } from 'react';
import ImportPane from './ImportPane';
import ArticleSearch from './ArticleSearch';
import LabelOptionsPane, { LabelOptions } from './LabelOptionsPane';
import PreviewPane from './PreviewPane';

const Shell: React.FC = () => {
  const [opts, setOpts] = useState<LabelOptions>({
    showArticleNumber: true,
    showEan: true,
    showShortText: true,
    showListPrice: true,
    showImage: false,
  });
  const [cart, setCart] = useState<any[]>([]);
  return (
    <div>
      {!window.bridge && (
        <div style={{ background: '#fdd835', padding: '8px', marginBottom: '8px' }}>
          Bridge nicht initialisiert – bitte als Electron-App starten
        </div>
      )}
      <h1>Etiketten</h1>
      <ImportPane />
      <ArticleSearch onCartChange={setCart} />
      <LabelOptionsPane opts={opts} onChange={setOpts} />
      <div>Warenkorb: {cart.length} Artikel</div>
      <PreviewPane opts={opts} cart={cart} />
    </div>
  );
};

export default Shell;
