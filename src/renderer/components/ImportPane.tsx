import React, { useEffect, useState } from 'react';
import { Button } from '@fluentui/react-components';

const ImportPane: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  useEffect(() => {
    const unsub = window.api?.onImportProgress?.((p: any) => setProgress(p));
    return () => {
      unsub && unsub();
    };
  }, []);

  const handleImport = async () => {
    if (file) {
      await window.api?.importDatanorm?.(false, (file as any).path);
    }
  };

  const pct = progress ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div>
      {!window.api && <div>Bridge nicht initialisiert</div>}
      <input type="file" accept=".txt,.asc,.zip" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Button onClick={handleImport} disabled={!file || !window.api}>
        Importieren
      </Button>
      {progress && <div>{pct}% ({progress.processed}/{progress.total})</div>}
    </div>
  );
};

export default ImportPane;
