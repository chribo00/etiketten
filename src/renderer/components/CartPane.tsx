import React, { useEffect, useState } from 'react';
import { Button } from '@fluentui/react-components';

interface Props {
  onChange?: () => void;
}

const CartPane: React.FC<Props> = ({ onChange }) => {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const list = await window.api.cart.get();
    setItems(list);
    if (onChange) onChange();
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <Button
        onClick={async () => {
          await window.api.cart.clear();
          await load();
        }}
      >
        Leeren
      </Button>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            {i.articleId} x {i.qty}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CartPane;
