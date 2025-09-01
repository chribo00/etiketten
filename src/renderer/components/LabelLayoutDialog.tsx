import React, { useEffect, useState } from 'react';
import { loadLayout, applyLayoutCssVariables, sanitizeLayout, validateLayout } from '../lib/labelLayoutStore';
import type { LayoutSettings } from '../../shared/layout';

type Props = { open: boolean; onClose: () => void };

export default function LabelLayoutDialog({ open, onClose }: Props) {
  const [v, setV] = useState<LayoutSettings | null>(null);

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
                    pageMargin: {
                      ...v.pageMargin,
                      top: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                    pageMargin: {
                      ...v.pageMargin,
                      bottom: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                    pageMargin: {
                      ...v.pageMargin,
                      left: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                    pageMargin: {
                      ...v.pageMargin,
                      right: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                    spacing: {
                      ...v.spacing,
                      horizontal: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                    spacing: {
                      ...v.spacing,
                      vertical: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                    labelSize: {
                      ...v.labelSize,
                      width: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                    labelSize: {
                      ...v.labelSize,
                      height: parseFloat(e.target.value.replace(',', '.')),
                    },
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
                value={v.grid.columns}
                onChange={e =>
                  setV({ ...v, grid: { ...v.grid, columns: parseFloat(e.target.value.replace(',', '.')) } })
                }
              />
            </label>
            <label>
              Zeilen
              <input
                type="number"
                value={v.grid.rows}
                onChange={e =>
                  setV({ ...v, grid: { ...v.grid, rows: parseFloat(e.target.value.replace(',', '.')) } })
                }
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Barcode</legend>
            <label>
              Höhe (mm)
              <input
                type="number"
                value={v.barcodeHeightMM ?? 18}
                onChange={e =>
                  setV({
                    ...v,
                    barcodeHeightMM: parseFloat(e.target.value.replace(',', '.')),
                  })
                }
              />
            </label>
          </fieldset>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Abbrechen</button>
          <button
            className="primary"
            onClick={async () => {
              if (!v) return;
              const sanitized = sanitizeLayout(v);
              const err = validateLayout(sanitized);
              if (err) {
                alert(err);
                return;
              }
              await window.api.settings.set('pageMargin', sanitized.pageMargin);
              await window.api.settings.set('spacing', sanitized.spacing);
              await window.api.settings.set('labelSize', sanitized.labelSize);
              await window.api.settings.set('grid', sanitized.grid);
              await window.api.settings.set('barcodeHeightMM', sanitized.barcodeHeightMM);
              await applyLayoutCssVariables(sanitized);
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
