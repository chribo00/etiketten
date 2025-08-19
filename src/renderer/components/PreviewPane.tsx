import React from 'react';
import LabelPreview from './LabelPreview';
import { Button } from '@fluentui/react-components';

const PreviewPane: React.FC = () => {
  const generate = async () => {
    const cart = await window.api.cart.get();
    await window.api.labels.generate(cart);
  };
  return (
    <div>
      <LabelPreview />
      <Button onClick={generate}>PDF erzeugen</Button>
    </div>
  );
};

export default PreviewPane;
