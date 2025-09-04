import React, { useEffect, useState } from 'react';
import type { Mapping, ImportRow } from './types';
import { normalizeString, normalizePrice } from './validators';

type Props = {
  headers: string[];
  rows: any[][];
  onBack: () => void;
  onMapped: (rows: ImportRow[], mapping: Mapping) => void;
};

const targetFields = [
  { key: 'articleNumber', label: 'Artikelnummer', required: true },
  { key: 'ean', label: 'EAN' },
  { key: 'name', label: 'Name', required: true },
  { key: 'price', label: 'Preis' },
  { key: 'unit', label: 'Einheit' },
  { key: 'productGroup', label: 'Produktgruppe' },
  { key: 'category', label: 'Kategorie' },
];

const StepMapping: React.FC<Props> = ({ headers, rows, onBack, onMapped }) => {
  const [mapping, setMapping] = useState<Mapping>({});

  useEffect(() => {
    const auto: Mapping = {};
    targetFields.forEach((f) => {
      const h = headers.find((hh) => hh.toLowerCase() === f.label.toLowerCase());
      if (h) auto[f.key] = h;
    });
    setMapping(auto);
  }, [headers]);

  const apply = () => {
    const idx: Record<string, number> = {};
    headers.forEach((h, i) => (idx[h] = i));
    const mapped: ImportRow[] = rows.map((r) => ({
      articleNumber: normalizeString(r[idx[mapping.articleNumber]]) || '',
      ean: normalizeString(r[idx[mapping.ean]]) || null,
      name: normalizeString(r[idx[mapping.name]]) || '',
      price: normalizePrice(r[idx[mapping.price]]),
      unit: normalizeString(r[idx[mapping.unit]]),
      productGroup: normalizeString(r[idx[mapping.productGroup]]),
      category: normalizeString(r[idx[mapping.category]]),
    }));
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
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [tf.key]: e.target.value }))
                  }
                >
                  <option value="">--</option>
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
        <button className="primary" onClick={apply}>
          Weiter
        </button>
      </div>
    </div>
  );
};

export default StepMapping;
