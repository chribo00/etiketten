import React, { useEffect, useState } from 'react';
import type { RawImportRow, ImportRow, Mapping, ImportSummary } from './types';
import { validateRows, type RowIssue } from './validators';

interface Props {
  rows: RawImportRow[];
  mapping: Mapping;
  onBack: () => void;
  onCancel: () => void;
  onComplete: (summary: ImportSummary, cancelled: boolean) => void;
}

const orderedFields: Array<keyof ImportRow> = [
  'articleNumber',
  'ean',
  'name',
  'price',
  'unit',
  'productGroup',
  'category',
];

const StepPreview: React.FC<Props> = ({ rows, mapping, onBack, onCancel, onComplete }) => {
  const [validatedRows, setValidatedRows] = useState<ImportRow[]>([]);
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [stats, setStats] = useState({ ok: 0, warn: 0, error: 0 });
  const [isImporting, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number }>({
    processed: 0,
    total: rows.length,
  });
  const [start, setStart] = useState<number | null>(null);

  useEffect(() => {
    const res = validateRows(rows, mapping);
    setValidatedRows(res.rows);
    setIssues(res.issues);
    setStats(res.stats);
  }, [rows, mapping]);

  const headers = orderedFields.filter((f) => mapping[f] !== undefined && mapping[f] !== null);
  const sample = validatedRows.slice(0, 100);

  useEffect(() => {
    if (!isImporting) return;
    const log = (() => {
      let last = 0;
      return (p: { processed: number; total: number }) => {
        const now = Date.now();
        if (now - last > 1000) {
          console.debug('import progress', p);
          last = now;
        }
        setProgress(p);
      };
    })();
    const unsub = window.api.import.onProgress(log);
    return () => {
      unsub();
    };
  }, [isImporting]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isImporting) startImport();
      if (e.key === 'Escape' && !isImporting) handleCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isImporting]);

  function handleCancel() {
    if (isImporting) {
      window.api.import.cancel();
    } else {
      if (window.confirm('Import abbrechen?')) onCancel();
    }
  }

  async function startImport() {
    console.info('Import gestartet');
    setStart(Date.now());
    setImporting(true);
    try {
      const goodRows = validatedRows.filter((_, i) => issues[i].errors.length === 0);
      const res: any = await window.api.import.run({ rows: goodRows });
      if (res?.ok) {
        console.info('Import beendet');
        onComplete(res.data, res.data.cancelled === true);
      } else {
        console.error('Import fehlgeschlagen', res?.error);
        alert(res?.error?.message || 'Import fehlgeschlagen');
        window.api.openDevTools();
        onCancel();
      }
    } catch (e: any) {
      console.error('Import Fehler', e);
      alert(e?.message || e);
      window.api.openDevTools();
      onCancel();
    } finally {
      setImporting(false);
    }
  }

  const eta = (() => {
    if (!isImporting || !start) return '';
    const elapsed = Date.now() - start;
    const rate = progress.processed / elapsed;
    if (!rate) return '';
    const remaining = (progress.total - progress.processed) / rate;
    const sec = Math.round(remaining / 1000);
    return ` (${sec}s)`;
  })();

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
      <div>
        <span>OK: {stats.ok}</span> | <span>Warnungen: {stats.warn}</span> |{' '}
        <span>Fehler: {stats.error}</span>
      </div>
      {mapping.name === undefined || mapping.name === null ? (
        <p className="warn">Name nicht gesetzt (leer gespeichert)</p>
      ) : null}
      {isImporting && (
        <div>
          <progress value={progress.processed} max={progress.total}></progress>
          <span>
            {progress.processed} / {progress.total}
            {eta}
          </span>
        </div>
      )}
      <div className="wizard-footer" role="toolbar">
        <button onClick={onBack} disabled={isImporting} aria-disabled={isImporting}>
          Zurück
        </button>
        <button onClick={handleCancel}>Abbrechen</button>
        <button
          className="primary"
          onClick={startImport}
          disabled={isImporting || stats.error > 0}
          aria-disabled={isImporting || stats.error > 0}
        >
          Import starten
        </button>
      </div>
    </div>
  );
};

export default StepPreview;
