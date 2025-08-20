import React, { useEffect, useState } from 'react';
import { Button } from '@fluentui/react-components';

const ImportPane: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string>('');
  const [progress, setProgress] = useState<{ processed: number; total?: number } | undefined>();
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  useEffect(() => {
    const off = window.api?.onImportProgress?.((p) => setProgress(p));
    return () => off?.();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedPath((f as any).path);
      setFileName(f.name);
    } else {
      setSelectedPath(undefined);
      setFileName('');
    }
  };

  const handleImport = async () => {
    if (!window.api) return;
    setIsImporting(true);
    setProgress(undefined);
    setImported(null);
    const res = await window.api.importDatanorm(!selectedPath, selectedPath);
    setIsImporting(false);
    setImported(res?.imported ?? null);
  };

  const canOpenDialog = !!window.api?.dialog?.openDatanorm;
  const disabled = !window.api || (!selectedPath && !canOpenDialog) || isImporting;
  const pct = progress?.total ? Math.round((progress.processed / progress.total) * 100) : undefined;

  return (
    <div>
      {!window.api && <div>Bridge nicht initialisiert</div>}
      <input type="file" accept=".001,.dat,.txt,.zip" onChange={handleFileChange} />
      {fileName && <div>{fileName}</div>}
      <Button onClick={handleImport} disabled={disabled}>
        {isImporting ? 'Importiere…' : 'Importieren'}
      </Button>
      {progress && (
        <div>
          {pct !== undefined ? `${pct}% (${progress.processed}/${progress.total})` : `${progress.processed}`}
        </div>
      )}
      {imported !== null && <div>Import erfolgreich: {imported} Artikel</div>}
    </div>
  );
};

export default ImportPane;
