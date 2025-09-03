import React from 'react';
import { Button, Tooltip } from '@fluentui/react-components';

type Props = {
  hasItems: boolean;
  onClear: () => void;
  onImport: () => void;
};

const CartActions: React.FC<Props> = ({ hasItems, onClear, onImport }) => {
  const clearDisabled = !hasItems;
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
        <Button onClick={onClear} disabled={clearDisabled}>
          Warenkorb leeren
        </Button>
        <Tooltip content="Dateien importieren (CSV/XLSX/TXT)" relationship="label">
          <span style={{ display: 'inline-flex' }}>
            <Button
              onClick={onImport}
              aria-label="Dateien importieren (CSV/XLSX/TXT)"
              title="Dateien importieren (CSV/XLSX/TXT)"
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
