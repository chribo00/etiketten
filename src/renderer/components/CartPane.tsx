import React, { useEffect, useState } from 'react';
import { Button } from '@fluentui/react-components';

const CartPane: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const list = await window.api.cart.get();
    setItems(list);
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <Button onClick={() => window.api.cart.clear().then(load)}>Leeren</Button>
      <ul>
        {items.map((i) => (
          <li key={i.id}>{i.articleId} x {i.qty}</li>
        ))}
      </ul>
    </div>
  );
};

export default CartPane;
