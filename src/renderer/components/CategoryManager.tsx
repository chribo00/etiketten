import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Input,
} from '@fluentui/react-components';

const CategoryManager: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState('');

  const load = async () => {
    const res = await window.bridge?.categories?.list();
    if (res?.ok) {
      setCategories(res.data);
    } else if (res?.error) {
      console.error('categories.list failed', res.error);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const create = async () => {
    if (!newName.trim()) return;
    const res = await window.bridge?.categories?.create(newName.trim());
    if (res && !res.error) {
      setNewName('');
      await load();
      window.dispatchEvent(new Event('categories:refresh'));
    }
  };

  const rename = async (id: number) => {
    const current = categories.find((c) => c.id === id);
    const name = prompt('Kategorie umbenennen', current?.name || '');
    if (!name) return;
    const res = await window.bridge?.categories?.update(id, name);
    if (!res?.error) {
      await load();
      window.dispatchEvent(new Event('categories:refresh'));
    } else {
      alert('Fehler: ' + res.error);
    }
  };

  const del = async (id: number) => {
    const choice = prompt(
      'Reassign zu Kategorie-ID oder leer für (keine). Tippe "delete" zum Löschen der Artikel.',
      '',
    );
    if (choice === null) return;
    let mode: 'reassign' | 'deleteArticles' = 'reassign';
    let to: number | null | undefined = undefined;
    if (choice.toLowerCase() === 'delete') {
      mode = 'deleteArticles';
    } else if (choice === '') {
      to = null;
    } else {
      const num = Number(choice);
      if (!isNaN(num)) to = num;
    }
    const res = await window.bridge?.categories?.delete(id, mode, to);
    if (!res?.error) {
      await load();
      window.dispatchEvent(new Event('categories:refresh'));
    } else {
      alert('Fehler: ' + res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Kategorien verwalten</DialogTitle>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {categories.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>{c.name}</div>
                <Button size="small" onClick={() => rename(c.id)}>
                  Umbenennen
                </Button>
                <Button size="small" appearance="secondary" onClick={() => del(c.id)}>
                  Löschen
                </Button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input value={newName} onChange={(_, d) => setNewName(d.value)} placeholder="Neue Kategorie" />
            <Button onClick={create}>Anlegen</Button>
          </div>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Schließen
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default CategoryManager;
