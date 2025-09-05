import React, { useMemo, useState } from 'react';
import type { Mapping, MappingField, ImportResult } from './types';

interface Props {
  headers: string[];
  rows: unknown[][];
  mapping: Mapping;
  onBack: () => void;
  onComplete: (result: ImportResult) => void;
}

const StepPreview: React.FC<Props> = ({ headers, rows, mapping, onBack, onComplete }) => {
  const [isImporting, setImporting] = useState(false);

  const mappedSample = useMemo(() => {
    const idx: Record<string, number> = {};
    headers.forEach((h, i) => (idx[h] = i));
    return rows.slice(0, 100).map((r) => {
      const obj: Record<string, unknown> = {};
      (Object.keys(mapping) as MappingField[]).forEach((key) => {
        const col = mapping[key];
        if (col) obj[key] = r[idx[col]];
      });
      return obj;
    });
  }, [headers, rows, mapping]);

  const targetHeaders = Object.keys(mapping);

  async function startImport() {
    setImporting(true);
    try {
      const idx: Record<string, number> = {};
      headers.forEach((h, i) => (idx[h] = i));
      const objects = rows.map((r, rowIdx) => {
        const obj: Record<string, unknown> = { row: rowIdx };
        (Object.keys(mapping) as MappingField[]).forEach((key) => {
          const col = mapping[key];
          if (col) obj[key] = r[idx[col]];
        });
        return obj;
      });
      const res: ImportResult = await window.api.invoke('articles:import', {
        rows: objects,
      });
      onComplete(res);
    } catch (e: any) {
      console.error('Import Fehler', e);
      alert(e?.message || e);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className={isImporting ? 'loading' : ''}>
      <div className="with-footer">
        <table>
          <thead>
            <tr>
              {targetHeaders.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mappedSample.map((r, i) => (
              <tr key={i}>
                {targetHeaders.map((h) => (
                  <td key={h}>{String((r as Record<string, unknown>)[h] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="wizard-footer" role="toolbar">
        <button onClick={onBack} disabled={isImporting} aria-disabled={isImporting}>
          Zurück
        </button>
        <button
          className="primary"
          onClick={startImport}
          disabled={isImporting || !mapping.articleNumber}
          aria-disabled={isImporting || !mapping.articleNumber}
        >
          {isImporting ? 'Importiere…' : 'Import starten'}
        </button>
      </div>
      {!mapping.articleNumber && <p style={{ color: 'red' }}>Artikelnummer muss gemappt sein</p>}
    </div>
  );
};

export default StepPreview;
