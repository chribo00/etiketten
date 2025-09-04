import React from 'react';
import type { ImportRow } from './types';

type Props = {
  rows: ImportRow[];
  onBack: () => void;
  onImport: (dryRun?: boolean) => void;
};

const StepPreview: React.FC<Props> = ({ rows, onBack, onImport }) => {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const sample = rows.slice(0, 100);

  return (
    <div>
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
                <td key={h}>{(r as any)[h]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modal-actions">
        <button onClick={onBack}>Zurück</button>
        <button className="primary" onClick={() => onImport(false)}>
          Import starten
        </button>
        <button onClick={() => onImport(true)}>Dry-Run</button>
      </div>
    </div>
  );
};

export default StepPreview;
