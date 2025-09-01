import React, { useState } from 'react';
import {
  getLabelLayout,
  setLabelLayout,
  LabelLayoutSettings,
} from '../lib/labelLayoutStore';

type Props = { open: boolean; onClose: () => void };

export default function LabelLayoutDialog({ open, onClose }: Props) {
  const [v, setV] = useState<LabelLayoutSettings>(getLabelLayout());
  if (!open) return null;

  const update = <K extends keyof LabelLayoutSettings>(
    key: K,
    value: LabelLayoutSettings[K],
  ) => setV({ ...v, [key]: value });

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
                  update('pageMargin', { ...v.pageMargin, top: +e.target.value })
                }
              />
            </label>
            <label>
              Unten (mm)
              <input
                type="number"
                value={v.pageMargin.bottom}
                onChange={e =>
                  update('pageMargin', {
                    ...v.pageMargin,
                    bottom: +e.target.value,
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
                  update('pageMargin', { ...v.pageMargin, left: +e.target.value })
                }
              />
            </label>
            <label>
              Rechts (mm)
              <input
                type="number"
                value={v.pageMargin.right}
                onChange={e =>
                  update('pageMargin', { ...v.pageMargin, right: +e.target.value })
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
                value={v.gap.col}
                onChange={e => update('gap', { ...v.gap, col: +e.target.value })}
              />
            </label>
            <label>
              Vertikal (mm)
              <input
                type="number"
                value={v.gap.row}
                onChange={e => update('gap', { ...v.gap, row: +e.target.value })}
              />
            </label>
            <label>
              Footer-Abstand oben (mm)
              <input
                type="number"
                value={v.footerMarginTop}
                onChange={e => update('footerMarginTop', +e.target.value as any)}
              />
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={v.hideArticleNumberBelowBarcode}
                onChange={e =>
                  update('hideArticleNumberBelowBarcode', e.target.checked)
                }
              />
              Artikelnummer unter Barcode ausblenden
            </label>
          </fieldset>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Abbrechen</button>
          <button
            className="primary"
            onClick={() => {
              setLabelLayout(v);
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
