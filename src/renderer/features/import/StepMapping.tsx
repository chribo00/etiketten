import React, { useState } from 'react';
import type { Mapping, MappingField } from './types';

type Props = {
  headers: string[];
  onBack: () => void;
  onMapped: (mapping: Mapping) => void;
};

const targetFields: { key: MappingField; label: string }[] = [
  { key: 'articleNumber', label: 'Artikelnummer' },
  { key: 'ean', label: 'EAN' },
  { key: 'name', label: 'Name' },
  { key: 'price', label: 'Preis' },
  { key: 'unit', label: 'Einheit' },
  { key: 'productGroup', label: 'Produktgruppe' },
  { key: 'category_id', label: 'Kategorie-ID' },
];

const StepMapping: React.FC<Props> = ({ headers, onBack, onMapped }) => {
  const [mapping, setMapping] = useState<Mapping>({});

  const apply = () => {
    onMapped(mapping);
  };

  return (
    <div>
      <table>
        <tbody>
          {targetFields.map((tf) => (
            <tr key={tf.key}>
              <td>{tf.label}</td>
              <td>
                <select
                  value={mapping[tf.key] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMapping((m) => {
                      const next = { ...m } as Mapping;
                      if (!val) delete next[tf.key];
                      else next[tf.key] = val;
                      return next;
                    });
                  }}
                >
          <option value="">– bitte auswählen –</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modal-actions">
        <button onClick={onBack} disabled aria-disabled="true">
          Zurück
        </button>
        <button
          className="primary"
          onClick={apply}
          disabled={!mapping.articleNumber}
          aria-disabled={!mapping.articleNumber}
        >
          Weiter
        </button>
      </div>
      {!mapping.articleNumber && <p style={{ color: 'red' }}>Bitte Artikelnummer zuweisen</p>}
    </div>
  );
};

export default StepMapping;
