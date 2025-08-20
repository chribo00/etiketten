import React, { useEffect, useState } from 'react';
import ImportPane from './ImportPane';
import ArticleSearch from './ArticleSearch';
import CartPane from './CartPane';
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
  const [cartCount, setCartCount] = useState(0);
  const refreshCart = async () => {
    const c = (await window.bridge?.cart?.get?.()) || [];
    setCartCount(c.length);
  };
  useEffect(() => {
    refreshCart();
  }, []);
  return (
    <div>
      {!window.bridge && (
        <div style={{ background: '#fdd835', padding: '8px', marginBottom: '8px' }}>
          Bridge nicht initialisiert – bitte als Electron-App starten
        </div>
      )}
      <h1>Etiketten</h1>
      <ImportPane />
      <ArticleSearch />
      <LabelOptionsPane opts={opts} onChange={setOpts} />
      <CartPane onChange={refreshCart} />
      <div>Warenkorb: {cartCount} Artikel</div>
      <PreviewPane opts={opts} />
    </div>
  );
};

export default Shell;
