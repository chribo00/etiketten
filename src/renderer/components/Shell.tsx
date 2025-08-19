import React, { useEffect, useState } from 'react';
import ImportPane from './ImportPane';
import SearchPane from './SearchPane';
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
    const c = await window.api.cart.get();
    setCartCount(c.length);
  };
  useEffect(() => {
    refreshCart();
  }, []);
  return (
    <div>
      <h1>Etiketten</h1>
      <ImportPane />
      <LabelOptionsPane opts={opts} onChange={setOpts} />
      <SearchPane defaultOpts={opts} onAdded={refreshCart} />
      <CartPane onChange={refreshCart} />
      <div>Warenkorb: {cartCount} Artikel</div>
      <PreviewPane opts={opts} />
    </div>
  );
};

export default Shell;
