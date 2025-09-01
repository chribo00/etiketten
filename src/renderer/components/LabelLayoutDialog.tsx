import React, { useEffect, useState } from 'react';
import { loadLayout, saveLayout, Layout } from '../lib/labelLayoutStore';

type Props = { open: boolean; onClose: () => void };

export default function LabelLayoutDialog({ open, onClose }: Props) {
  const [v, setV] = useState<Layout | null>(null);

  useEffect(() => {
    if (open) {
      loadLayout().then(setV);
    }
  }, [open]);

  if (!open || !v) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Etiketten formatieren</h2>
        <div className="grid-2">
          <fieldset>
            <legend>Druckabstand (Seitenränder)</legend>
            <label>
              Oben (mm)
              <input
                type="number"
                value={v.pageMargin.top}
                onChange={e =>
                  setV({
                    ...v,
                    pageMargin: { ...v.pageMargin, top: +e.target.value },
                  })
                }
              />
            </label>
            <label>
              Unten (mm)
              <input
                type="number"
                value={v.pageMargin.bottom}
                onChange={e =>
                  setV({
                    ...v,
                    pageMargin: { ...v.pageMargin, bottom: +e.target.value },
                  })
                }
              />
            </label>
            <label>
              Links (mm)
              <input
                type="number"
                value={v.pageMargin.left}
                onChange={e =>
                  setV({
                    ...v,
                    pageMargin: { ...v.pageMargin, left: +e.target.value },
                  })
                }
              />
            </label>
            <label>
              Rechts (mm)
              <input
                type="number"
                value={v.pageMargin.right}
                onChange={e =>
                  setV({
                    ...v,
                    pageMargin: { ...v.pageMargin, right: +e.target.value },
                  })
                }
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Abstand zwischen Etiketten</legend>
            <label>
              Horizontal (mm)
              <input
                type="number"
                value={v.spacing.horizontal}
                onChange={e =>
                  setV({
                    ...v,
                    spacing: { ...v.spacing, horizontal: +e.target.value },
                  })
                }
              />
            </label>
            <label>
              Vertikal (mm)
              <input
                type="number"
                value={v.spacing.vertical}
                onChange={e =>
                  setV({
                    ...v,
                    spacing: { ...v.spacing, vertical: +e.target.value },
                  })
                }
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Etikettengröße</legend>
            <label>
              Breite (mm)
              <input
                type="number"
                value={v.labelSize.width}
                onChange={e =>
                  setV({
                    ...v,
                    labelSize: { ...v.labelSize, width: +e.target.value },
                  })
                }
              />
            </label>
            <label>
              Höhe (mm)
              <input
                type="number"
                value={v.labelSize.height}
                onChange={e =>
                  setV({
                    ...v,
                    labelSize: { ...v.labelSize, height: +e.target.value },
                  })
                }
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Gitter</legend>
            <label>
              Spalten
              <input
                type="number"
                value={v.columns}
                onChange={e => setV({ ...v, columns: +e.target.value })}
              />
            </label>
            <label>
              Zeilen
              <input
                type="number"
                value={v.rows}
                onChange={e => setV({ ...v, rows: +e.target.value })}
              />
            </label>
          </fieldset>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Abbrechen</button>
          <button
            className="primary"
            onClick={async () => {
              await saveLayout(v);
              onClose();
            }}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
