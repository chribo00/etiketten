import React from 'react';
import type { ImportResult } from './types';

interface Props {
  result: ImportResult;
  onClose: () => void;
  onRestart: () => void;
}

const StepResult: React.FC<Props> = ({ result, onClose, onRestart }) => {
  const { okCount, insertedCount, updatedCount, skippedCount, errorCount, errorsCsv } = result;

  const downloadErrors = () => {
    if (!errorsCsv) return;
    const blob = new Blob([errorsCsv], { type: 'text/csv' });
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
        <div className="badge">OK: {okCount}</div>
        <div className="badge">Inserted: {insertedCount}</div>
        <div className="badge">Updated: {updatedCount}</div>
        <div className="badge">Skipped: {skippedCount}</div>
        <div className="badge">Errors: {errorCount}</div>
      </div>
      {errorCount > 0 && (
        <button onClick={downloadErrors}>Fehler als CSV herunterladen</button>
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
