import React, { useEffect, useState } from 'react';
import { Button } from '@fluentui/react-components';

const ImportPane: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  useEffect(() => {
    window.api.onImportProgress((p: any) => setProgress(p));
  }, []);

  const handleImport = async () => {
    if (file) {
      await window.api.importDatanorm((file as any).path);
    }
  };

  const pct = progress ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div>
      <input type="file" accept=".txt,.asc,.zip" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Button onClick={handleImport} disabled={!file}>
        Importieren
      </Button>
      {progress && <div>{pct}% ({progress.processed}/{progress.total})</div>}
    </div>
  );
};

export default ImportPane;
