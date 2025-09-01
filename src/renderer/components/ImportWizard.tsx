import React, { useState } from 'react';
import { parseFile } from '../lib/import/parsers';
import { applyMapping, Mapping } from '../lib/import/applyMapping';

const targetFields = [
  { key: 'artikelnummer', label: 'Artikelnummer', required: true },
  { key: 'ean', label: 'EAN' },
  { key: 'kurztext', label: 'Kurztext' },
  { key: 'preis', label: 'Preis' },
  { key: 'einheit', label: 'Einheit' },
];

type Props = { open: boolean; onClose: () => void };

export const ImportWizard: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    const parsed = await parseFile(f);
    setHeaders(parsed.headers);
    setRows(parsed.rows.slice(0, 100));
    setFile(f);
    setStep(2);
  };

  const startImport = async () => {
    const items = applyMapping({ rows, headers, mapping });
    if (!items.length) {
      setError('Keine gültigen Daten gefunden');
      return;
    }
    await window.api.articles.upsertMany(items as any);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Import</h2>
        {step === 1 && (
          <div>
            <input
              type="file"
              accept=".csv,.txt,.tsv,.xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </div>
        )}
        {step === 2 && (
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
                          setMapping({ ...mapping, [tf.key]: e.target.value })
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
            {error && <div className="error">{error}</div>}
            <div className="modal-actions">
              <button onClick={() => setStep(1)}>Zurück</button>
              <button
                className="primary"
                onClick={startImport}
              >
                Import starten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportWizard;

