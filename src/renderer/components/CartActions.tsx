import React from 'react';
import { Button, Tooltip } from '@fluentui/react-components';

type Props = {
  hasItems: boolean;
  onClear: () => void;
  onImport: () => void;
};

const CartActions: React.FC<Props> = ({ hasItems, onClear, onImport }) => {
  const disabled = !hasItems;
  return (
    <div
      style={{
        marginTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={onClear} disabled={disabled}>
          Warenkorb leeren
        </Button>
        <Tooltip
          content="Import erfordert mindestens 1 Artikel im Warenkorb."
          relationship="label"
          disabled={!disabled}
        >
          <span style={{ display: 'inline-flex' }}>
            <Button
              onClick={onImport}
              disabled={disabled}
              aria-disabled={disabled}
              aria-label="Importieren (CSV/XLSX/TXT)"
              title={disabled ? 'Import erfordert mindestens 1 Artikel im Warenkorb.' : undefined}
            >
              Importieren (CSV/XLSX/TXT)
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default CartActions;
