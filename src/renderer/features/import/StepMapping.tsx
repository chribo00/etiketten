import React, { useState } from 'react';
import type { Mapping, PreviewRow, MappingField } from './types';

type Props = {
  headers: string[];
  rows: unknown[][];
  onBack: () => void;
  onMapped: (rows: PreviewRow[], mapping: Mapping) => void;
};

const targetFields: { key: MappingField; label: string }[] = [
  { key: 'articleNumber', label: 'Artikelnummer' },
  { key: 'ean', label: 'EAN' },
  { key: 'name', label: 'Name' },
  { key: 'price', label: 'Preis' },
  { key: 'unit', label: 'Einheit' },
  { key: 'productGroup', label: 'Produktgruppe' },
  { key: 'category', label: 'Kategorie' },
];

const StepMapping: React.FC<Props> = ({ headers, rows, onBack, onMapped }) => {
  const [mapping, setMapping] = useState<Mapping>({});

  const apply = () => {
    const idx: Record<string, number> = {};
    headers.forEach((h, i) => (idx[h] = i));
    const mapped: PreviewRow[] = rows.map((r) => {
      const obj: PreviewRow = {};
      (Object.keys(mapping) as MappingField[]).forEach((key) => {
        const col = mapping[key];
        if (col) obj[key] = r[idx[col]];
      });
      return obj;
    });
    onMapped(mapped, mapping);
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
        <button onClick={onBack}>Zurück</button>
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
