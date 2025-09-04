import React from 'react';
import type { ImportSummary } from './types';

interface Props {
  summary: ImportSummary;
  cancelled: boolean;
  onClose: () => void;
  onRestart: () => void;
}

const StepResult: React.FC<Props> = ({ summary, cancelled, onClose, onRestart }) => {
  const { total, inserted, updated, skipped, errors } = summary;

  const exportErrors = () => {
    const header = 'rowIndex,articleNumber,message\n';
    const rows = errors
      .map((e) =>
        `${e.rowIndex + 1},${e.articleNumber || ''},"${(e.message || '').replace(/"/g, '""')}"`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {cancelled ? (
        <p>Import abgebrochen.</p>
      ) : (
        <div className="summary">
          <div className="badge">Total: {total}</div>
          <div className="badge">Inserted: {inserted}</div>
          <div className="badge">Updated: {updated}</div>
          <div className="badge">Skipped: {skipped}</div>
          <div className="badge">Errors: {errors.length}</div>
        </div>
      )}
      {!cancelled && errors.length > 0 && (
        <button onClick={exportErrors}>Fehler als CSV exportieren</button>
      )}
      <div className="wizard-footer" role="toolbar">
        {cancelled ? (
          <>
            <button onClick={onRestart}>Erneut versuchen</button>
            <button className="primary" onClick={onClose}>
              Schließen
            </button>
          </>
        ) : (
          <>
            <button onClick={onRestart}>Erneut importieren</button>
            <button className="primary" onClick={onClose}>
              Fertig
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default StepResult;
