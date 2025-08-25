import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Select } from '@fluentui/react-components';

const ImportPane: React.FC = () => {
  const [selected, setSelected] = useState<{ filePath: string; name: string } | null>(null);
  const [flags, setFlags] = useState({
    articleNumber: true,
    ean: true,
    shortText: true,
    price: true,
    image: true,
  });
  const [busy, setBusy] = useState(false);
  const [importSummary, setImportSummary] = useState('');
  const [dbInfoText, setDbInfoText] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const loadInfo = async () => {
    const info = await window.bridge?.dbInfo?.();
    if (info) setDbInfoText(`DB enthält ${info.rowCount} Artikel`);
  };

  const loadCategories = async () => {
    const list = await window.bridge?.categories?.list();
    setCategories(list || []);
  };

  useEffect(() => {
    loadInfo();
    loadCategories();
  }, []);

  const pickFile = async () => {
    const res = await window.bridge?.pickDatanormFile?.();
    if (res) setSelected(res);
  };

  const refreshList = () => {
    window.dispatchEvent(new Event('articles:refresh'));
  };

  const onImport = async () => {
    if (!selected?.filePath) return;
    setBusy(true);
    const res = await window.bridge?.importDatanorm?.({ filePath: selected.filePath, mapping: flags, categoryId });
    setBusy(false);
    if (res) {
      setImportSummary(`Parsed ${res.parsed} | Inserted ${res.inserted} | Updated ${res.updated} | ${res.durationMs} ms`);
    }
    refreshList();
    await loadInfo();
  };

  const disabled = !window.bridge?.ready || !selected?.filePath || busy;

  const toggle = (key: keyof typeof flags) => (_: any, data: any) =>
    setFlags((prev) => ({ ...prev, [key]: !!data.checked }));

  const onCreateCategory = async () => {
    const name = prompt('Neue Kategorie');
    if (name) {
      const res = await window.bridge?.categories?.create(name);
      await loadCategories();
      if (res?.id) setCategoryId(res.id);
    }
  };

  return (
    <div>
      <Button onClick={pickFile} disabled={busy}>Datei auswählen</Button>
      {selected?.name && <div>{selected.name}</div>}
      <div>
        <label>
          Kategorie:
          <Select
            value={categoryId?.toString() || ''}
            onChange={async (_, d) => {
              if (d.value === '__new') {
                await onCreateCategory();
                return;
              }
              setCategoryId(d.value ? Number(d.value) : undefined);
            }}
          >
            <option value="">(keine)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id.toString()}>
                {c.name}
              </option>
            ))}
            <option value="__new">Neue Kategorie…</option>
          </Select>
        </label>
      </div>
      <div>
        <Checkbox label="Artikelnummer" checked={flags.articleNumber} onChange={toggle('articleNumber')} />
        <Checkbox label="EAN" checked={flags.ean} onChange={toggle('ean')} />
        <Checkbox label="Kurztext" checked={flags.shortText} onChange={toggle('shortText')} />
        <Checkbox label="Preis" checked={flags.price} onChange={toggle('price')} />
        <Checkbox label="Bild" checked={flags.image} onChange={toggle('image')} />
      </div>
      <Button onClick={onImport} disabled={disabled}>
        {busy ? 'Importiere…' : 'Importieren'}
      </Button>
      {importSummary && <div>{importSummary}</div>}
      {dbInfoText && <div>{dbInfoText}</div>}
    </div>
  );
};

export default ImportPane;
