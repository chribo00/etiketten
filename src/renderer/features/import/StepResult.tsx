import React, { useMemo } from 'react';
import type { ImportResult } from './types';

interface Props {
  result: ImportResult;
  onClose: () => void;
  onRestart: () => void;
}

const StepResult: React.FC<Props> = ({ result, onClose, onRestart }) => {
  const { ok, inserted, updated, skipped, errors, errorRows } = result;

  const errorCsv = useMemo(() => {
    if (!errorRows || errorRows.length === 0) return null;
    const headers = Array.from(new Set(errorRows.flatMap((r) => Object.keys(r))));
    const lines = [headers.join(';')];
    for (const r of errorRows) {
      lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(';'));
    }
    return lines.join('\n');
  }, [errorRows]);

  const downloadErrors = () => {
    if (!errorCsv) return;
    const blob = new Blob([errorCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="summary">
        <div className="badge">OK: {ok}</div>
        <div className="badge">Inserted: {inserted}</div>
        <div className="badge">Updated: {updated}</div>
        <div className="badge">Skipped: {skipped}</div>
        <div className="badge">Errors: {errors}</div>
      </div>
      {errorRows.length > 0 && (
        <details>
          <summary>Fehler anzeigen</summary>
          <ul>
            {errorRows.map((e) => (
              <li key={e.row}>Zeile {e.row + 1}: {e.message}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="wizard-footer" role="toolbar">
        <button onClick={downloadErrors} disabled={!errorCsv} aria-disabled={!errorCsv}>
          Fehler als CSV herunterladen
        </button>
        <button onClick={onRestart}>Erneut importieren</button>
        <button className="primary" onClick={onClose}>
          Fertig
        </button>
      </div>
    </div>
  );
};

export default StepResult;
