import React, { useState } from 'react';
import type { Mapping, RawImportRow, MappingField } from './types';
import { normalizeString } from './validators';

type Props = {
  headers: string[];
  rows: unknown[][];
  onBack: () => void;
  onMapped: (rows: RawImportRow[], mapping: Mapping) => void;
};

const targetFields: { key: MappingField; label: string; required?: boolean }[] = [
  { key: 'articleNumber', label: 'Artikelnummer', required: true },
  { key: 'ean', label: 'EAN' },
  { key: 'name', label: 'Name' },
  { key: 'price', label: 'Preis' },
  { key: 'unit', label: 'Einheit' },
  { key: 'productGroup', label: 'Produktgruppe' },
  { key: 'category', label: 'Kategorie' },
];

const NO_MAP = '__NONE__';

const StepMapping: React.FC<Props> = ({ headers, rows, onBack, onMapped }) => {
  const [mapping, setMapping] = useState<Mapping>({});

  const apply = () => {
    const idx: Record<string, number> = {};
    headers.forEach((h, i) => (idx[h] = i));
    const mapped: RawImportRow[] = rows.map((r) => {
      const obj: Partial<Record<MappingField, unknown>> = {};
      targetFields.forEach(({ key }) => {
        const m = mapping[key];
        if (typeof m === 'string') {
          obj[key] = normalizeString(r[idx[m]]);
        }
      });
      return obj as RawImportRow;
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
                  value={
                    mapping[tf.key] === null
                      ? NO_MAP
                      : mapping[tf.key] || ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setMapping((m) => {
                      const next = { ...m } as Mapping;
                      if (!val) {
                        delete next[tf.key];
                      } else if (val === NO_MAP) {
                        next[tf.key] = null;
                      } else {
                        next[tf.key] = val;
                      }
                      return next;
                    });
                  }}
                >
                  <option value="">— auswählen —</option>
                  <option value={NO_MAP}>— nicht zuordnen —</option>
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
      {mapping.articleNumber && (mapping.name == null || mapping.name === undefined) && (
        <p className="warn">Name nicht zugeordnet – neue Artikel werden ohne Namen gespeichert.</p>
      )}
      <div className="modal-actions">
        <button onClick={onBack}>Zurück</button>
        <button
          className="primary"
          onClick={apply}
          disabled={typeof mapping.articleNumber !== 'string'}
          aria-disabled={typeof mapping.articleNumber !== 'string'}
        >
          Weiter
        </button>
      </div>
    </div>
  );
};

export default StepMapping;
