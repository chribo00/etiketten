import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Select } from '@fluentui/react-components';
import CategoryManager from './CategoryManager';

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
  const [catManagerOpen, setCatManagerOpen] = useState(false);

  const loadInfo = async () => {
    const res = await window.bridge?.dbInfo?.();
    if (res?.ok) {
      setDbInfoText(`DB enthält ${res.data.rowCount} Artikel`);
    } else if (res?.error) {
      console.error('dbInfo failed', res.error);
    }
  };

  const loadCategories = async () => {
    const res = await window.bridge?.categories?.list();
    if (res?.ok) {
      setCategories(res.data);
    } else if (res?.error) {
      console.error('categories.list failed', res.error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadInfo();
    loadCategories();
    const handler = () => loadCategories();
    window.addEventListener('categories:refresh', handler);
    return () => window.removeEventListener('categories:refresh', handler);
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
      window.dispatchEvent(new Event('categories:refresh'));
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
        <Button size="small" style={{ marginLeft: 8 }} onClick={() => setCatManagerOpen(true)}>
          Kategorien verwalten…
        </Button>
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
      <CategoryManager open={catManagerOpen} onClose={() => setCatManagerOpen(false)} />
    </div>
  );
};

export default ImportPane;
