import React, { useEffect, useState } from 'react';
import { Button } from '@fluentui/react-components';

const ImportPane: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ phase: string; current: number; total?: number } | undefined>();
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  useEffect(() => {
    const off = window.bridge?.onImportProgress?.((p) => setProgress(p));
    return () => off?.();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleImport = async () => {
    if (!window.bridge?.importDatanorm || !file) return;
    setIsImporting(true);
    setProgress(undefined);
    setImported(null);
    try {
      const buffer = await file.arrayBuffer();
      const res = await window.bridge.importDatanorm({ fileBuffer: buffer });
      setImported(res.imported);
    } finally {
      setIsImporting(false);
    }
  };
  const disabled = !window.bridge?.ready || !file || isImporting;
  const pct = progress?.total ? Math.round((progress.current / progress.total) * 100) : undefined;

  return (
    <div>
      <div>{window.bridge?.ready ? 'Bridge initialisiert' : 'Bridge nicht initialisiert'}</div>
      <input type="file" accept=".001,.dat,.txt,.zip" onChange={handleFileChange} />
      {file && <div>{file.name}</div>}
      <Button onClick={handleImport} disabled={disabled}>
        {isImporting ? 'Importiere…' : 'Importieren'}
      </Button>
      {progress && (
        <div>
          {pct !== undefined ? `${pct}% (${progress.current}/${progress.total})` : `${progress.current}`}
        </div>
      )}
      {imported !== null && <div>Import erfolgreich: {imported} Artikel</div>}
    </div>
  );
};

export default ImportPane;
