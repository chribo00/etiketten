import React, { useEffect, useState } from 'react';
import {
  loadLabelSettings,
  saveLabelSettings,
  validateA4,
  applyCssVars,
  maxLabelWidthMm,
  maxLabelHeightMm,
  normalizeForAuto,
} from '../labels/formatSettings';
import type { LabelSettings } from '../labels/formatSettings';

type Props = { open: boolean; onClose: () => void };

export default function LabelLayoutDialog({ open, onClose }: Props) {
  const [v, setV] = useState<LabelSettings | null>(null);

  useEffect(() => {
    if (open) {
      setV(loadLabelSettings());
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
                value={v.page.top}
                onChange={e =>
                  setV({
                    ...v,
                    page: {
                      ...v.page,
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
                value={v.page.bottom}
                onChange={e =>
                  setV({
                    ...v,
                    page: {
                      ...v.page,
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
                value={v.page.left}
                onChange={e =>
                  setV({
                    ...v,
                    page: {
                      ...v.page,
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
                value={v.page.right}
                onChange={e =>
                  setV({
                    ...v,
                    page: {
                      ...v.page,
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
                value={v.gap.col}
                onChange={e =>
                  setV({
                    ...v,
                    gap: {
                      ...v.gap,
                      col: parseFloat(e.target.value.replace(',', '.')),
                    },
                  })
                }
              />
            </label>
            <label>
              Vertikal (mm)
              <input
                type="number"
                value={v.gap.row}
                onChange={e =>
                  setV({
                    ...v,
                    gap: {
                      ...v.gap,
                      row: parseFloat(e.target.value.replace(',', '.')),
                    },
                  })
                }
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Etikettengröße</legend>
            <div>
              <label>
                Breite (mm)
                <input
                  type="number"
                  disabled={v.label.autoWidth}
                  value={v.label.width}
                  onChange={e =>
                    setV({
                      ...v,
                      label: {
                        ...v.label,
                        width: parseFloat(e.target.value.replace(',', '.')),
                      },
                    })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={v.label.autoWidth ?? false}
                  onChange={e =>
                    setV({
                      ...v,
                      label: { ...v.label, autoWidth: e.target.checked },
                    })
                  }
                />
                Auto
              </label>
              <div>Max: {maxLabelWidthMm(v).toFixed(2)} mm</div>
            </div>
            <div>
              <label>
                Höhe (mm)
                <input
                  type="number"
                  disabled={v.label.autoHeight}
                  value={v.label.height}
                  onChange={e =>
                    setV({
                      ...v,
                      label: {
                        ...v.label,
                        height: parseFloat(e.target.value.replace(',', '.')),
                      },
                    })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={v.label.autoHeight ?? false}
                  onChange={e =>
                    setV({
                      ...v,
                      label: { ...v.label, autoHeight: e.target.checked },
                    })
                  }
                />
                Auto
              </label>
              <div>Max: {maxLabelHeightMm(v).toFixed(2)} mm</div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Gitter</legend>
            <label>
              Spalten
              <input
                type="number"
                value={v.grid.cols}
                onChange={e =>
                  setV({ ...v, grid: { ...v.grid, cols: parseFloat(e.target.value.replace(',', '.')) } })
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
                value={v.barcode.height}
                onChange={e =>
                  setV({
                    ...v,
                    barcode: { height: parseFloat(e.target.value.replace(',', '.')) },
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
            onClick={() => {
              if (!v) return;
              const s: LabelSettings = JSON.parse(JSON.stringify(v));
              normalizeForAuto(s);
              const err = validateA4(s);
              if (err) {
                alert(err);
                return;
              }
              saveLabelSettings(s);
              applyCssVars(s);
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
