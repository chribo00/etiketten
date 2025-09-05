import React, { useMemo } from 'react';
import type { ImportResult } from './types';

interface Props {
  result: ImportResult;
  onClose: () => void;
  onRestart: () => void;
}

const StepResult: React.FC<Props> = ({ result, onClose, onRestart }) => {
  const { ok, inserted, updated, skipped, errors } = result;

  const errorCsv = useMemo(() => {
    if (!errors || errors.length === 0) return null;
    const lines = ['row;code;message;sql;params'];
    for (const e of errors) {
      lines.push(
        `${e.row};${e.code ?? ''};"${e.message.replaceAll('"', '""')}";"${e.sql.replaceAll('"', '""')}";"${JSON.stringify(e.params).replaceAll('"', '""')}"`
      );
    }
    return lines.join('\n');
  }, [errors]);

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
        <div className="badge">Errors: {errors.length}</div>
      </div>
      {errors.length > 0 && (
        <details>
          <summary>Fehler anzeigen</summary>
          <ul>
            {errors.map((e) => (
              <li key={e.row}>
                row={e.row}; sql={e.sql}; params={JSON.stringify(e.params)}; code={e.code ?? ''}; message={e.message}
              </li>
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
