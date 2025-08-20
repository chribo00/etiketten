import React, { useEffect, useState } from 'react';
import { Button, Checkbox } from '@fluentui/react-components';

const ImportPane: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<{ filePath: string; name: string } | null>(null);
  const [flags, setFlags] = useState({
    articleNumber: true,
    ean: true,
    shortText: true,
    price: true,
    image: true,
  });
  const [progress, setProgress] = useState<{ phase: string; current: number; total?: number } | undefined>();
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  useEffect(() => {
    const off = window.bridge?.onImportProgress?.((p) => setProgress(p));
    return () => off?.();
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile({
      filePath: (f as any).path ?? '',
      name: f.name,
    });
  };

  const toggle = (key: keyof typeof flags) => (_: any, data: any) =>
    setFlags((prev) => ({ ...prev, [key]: !!data.checked }));

  const handleImport = async () => {
    if (!window.bridge?.importDatanorm) return;
    if (!selectedFile?.filePath) {
      alert('Kein Dateipfad vorhanden. Bitte Datei neu auswählen.');
      return;
    }
    setIsImporting(true);
    setProgress(undefined);
    setImported(null);
    try {
      const res = await window.bridge.importDatanorm({
        filePath: selectedFile.filePath,
        name: selectedFile.name,
        mapping: {
          articleNumber: flags.articleNumber,
          ean: flags.ean,
          shortText: flags.shortText,
          price: flags.price,
          image: flags.image,
        },
      });
      if (res?.imported !== undefined) setImported(res.imported);
    } catch (err) {
      console.error('importDatanorm failed', err);
    } finally {
      setIsImporting(false);
    }
  };
  const disabled = !window.bridge?.ready || !selectedFile?.filePath || isImporting;
  const pct = progress?.total ? Math.round((progress.current / progress.total) * 100) : undefined;

  return (
    <div>
      <input type="file" accept=".001,.dat,.txt,.zip" onChange={onFileChange} />
      {selectedFile?.name && <div>{selectedFile.name}</div>}
      <div>
        <Checkbox label="Artikelnummer" checked={flags.articleNumber} onChange={toggle('articleNumber')} />
        <Checkbox label="EAN" checked={flags.ean} onChange={toggle('ean')} />
        <Checkbox label="Kurztext" checked={flags.shortText} onChange={toggle('shortText')} />
        <Checkbox label="Preis" checked={flags.price} onChange={toggle('price')} />
        <Checkbox label="Bild" checked={flags.image} onChange={toggle('image')} />
      </div>
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
