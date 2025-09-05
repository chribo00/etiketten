import React, { useState } from 'react';
import type { Mapping, PreviewRow, ImportResult } from './types';

interface Props {
  rows: PreviewRow[];
  mapping: Mapping;
  onBack: () => void;
  onCancel: () => void;
  onComplete: (result: ImportResult) => void;
}

const StepPreview: React.FC<Props> = ({ rows, mapping, onBack, onCancel, onComplete }) => {
  const [isImporting, setImporting] = useState(false);

  const headers = Object.keys(mapping);
  const sample = rows.slice(0, 100);

  async function startImport() {
    setImporting(true);
    try {
      const res = await window.api.articles.import({ rows, mappedColumns: mapping });
      onComplete(res);
    } catch (e: any) {
      console.error('Import Fehler', e);
      alert(e?.message || e);
      onCancel();
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
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.map((r, i) => (
              <tr key={i}>
                {headers.map((h) => (
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
        <button onClick={onCancel} disabled={isImporting} aria-disabled={isImporting}>
          Abbrechen
        </button>
        <button
          className="primary"
          onClick={startImport}
          disabled={isImporting}
          aria-disabled={isImporting}
        >
          Import starten
        </button>
      </div>
    </div>
  );
};

export default StepPreview;
