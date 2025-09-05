import React from 'react';
import type { ImportResult } from './types';

interface Props {
  result: ImportResult;
  onClose: () => void;
  onRestart: () => void;
}

const StepResult: React.FC<Props> = ({ result, onClose, onRestart }) => {
  const { ok, inserted, updated, skipped, errors } = result;

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
              <li key={e.row}>Zeile {e.row + 1}: {e.message}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="wizard-footer" role="toolbar">
        <button onClick={onRestart}>Erneut importieren</button>
        <button className="primary" onClick={onClose}>
          Fertig
        </button>
      </div>
    </div>
  );
};

export default StepResult;
