import React, { useEffect, useState } from 'react';
import { Button, Input, Checkbox } from '@fluentui/react-components';
import { z } from 'zod';
import { generateLabelsPdf } from '../lib/labelsPdf';
import type { LabelConfig } from '../lib/labels';
import { fromArticleToEan13, isValidEan13, onlyDigits } from '../lib/labels';

const currency = new Intl.NumberFormat('de-AT', {
  style: 'currency',
  currency: 'EUR',
});

const ArticleSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortBy, setSortBy] = useState<'name' | 'articleNumber' | 'price'>('name');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [dbInfoText, setDbInfoText] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [generatedEans, setGeneratedEans] = useState<Set<string>>(new Set());
    const [cart, setCart] = useState<any[]>([]);

    const templates: Record<string, Partial<LabelConfig>> = {
      'a4-3x8': {},
      'a4-3x7': { cols: 3, rows: 7, labelW: 70, labelH: 37 },
      'a4-2x7': { cols: 2, rows: 7, labelW: 99, labelH: 38 },
    };
    const [template, setTemplate] = useState<keyof typeof templates>('a4-3x8');
    const [barcodeH, setBarcodeH] = useState(18);

    const onPdf = async () => {
      if (!cart.length) return;
      await generateLabelsPdf(cart, { ...templates[template], barcodeH });
    };

    const [artnr, setArtnr] = useState('');
    const [name, setName] = useState('');
    const [ean, setEan] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('');
    const [addToCart, setAddToCart] = useState(true);
    const [autoEan, setAutoEan] = useState(true);
    const [eanDirty, setEanDirty] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
      if (!autoEan || eanDirty) return;
      const t = setTimeout(() => {
        setEan(fromArticleToEan13(artnr) || '');
      }, 200);
      return () => clearTimeout(t);
    }, [artnr, autoEan, eanDirty]);

  const loadInfo = async () => {
    const info = await window.bridge?.dbInfo?.();
    if (info) setDbInfoText(`DB enthält ${info.rowCount} Artikel`);
  };

  const refreshList = async (
    p = page,
    sb: 'name' | 'articleNumber' | 'price' = sortBy,
    sd: 'ASC' | 'DESC' = sortDir,
  ) => {
      if (!window.bridge?.searchAll) return;
      setLoading(true);
      setError(null);
      const offset = (p - 1) * pageSize;
      try {
        const res = await window.bridge.searchAll({
          text: query.trim() || undefined,
          limit: pageSize,
          offset,
          sortBy: sb,
          sortDir: sd,
        });
      if (res?.message) {
        setError(res.message);
        setItems([]);
        setTotal(0);
      } else {
          setItems(res.items || []);
          setTotal(res.total || 0);
        }
      } catch (err: any) {
      console.error('searchArticles failed', err);
      setError(err?.message || 'Unbekannter Fehler');
      setItems([]);
      setTotal(0);
    }
    setLoading(false);
    setLoaded(true);
  };

  useEffect(() => {
    loadInfo();
    refreshList();
    const handler = () => {
      loadInfo();
      refreshList();
    };
    window.addEventListener('articles:refresh', handler);
    return () => window.removeEventListener('articles:refresh', handler);
  }, []);

  const onSearch = async () => {
    setPage(1);
    await refreshList(1);
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await onSearch();
    }
  };

  const prev = async () => {
    const p = page - 1;
    setPage(p);
    await refreshList(p);
  };

  const next = async () => {
    const p = page + 1;
    setPage(p);
    await refreshList(p);
  };

  const toggleSort = async (col: 'name' | 'articleNumber' | 'price') => {
    let dir: 'ASC' | 'DESC' = sortDir;
    if (sortBy === col) {
      dir = dir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      dir = 'ASC';
    }
    setSortBy(col);
    setSortDir(dir);
    setPage(1);
    await refreshList(1, col, dir);
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, (page - 1) * pageSize + items.length);

    const apiReady = window.bridge?.ready === true;

    const getKey = (it: any) =>
      it.source === 'custom' ? `custom:${it.id}` : `import:${it.articleNumber}`;

    const toggleSelect = (key: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    const addSelectionToCart = () => {
      const toAdd = items.filter((it) => selectedIds.has(getKey(it)));
      setCart((prev) => {
        const next = [...prev];
        for (const it of toAdd) {
          const key = getKey(it);
          const existing = next.find((c) =>
            c.source === it.source &&
            (c.source === 'custom' ? c.id === it.id : c.articleNumber === it.articleNumber),
          );
          if (existing) existing.qty += 1;
          else next.push({ ...it, qty: 1, generated: generatedEans.has(key) });
        }
        return next;
      });
      setSelectedIds(new Set());
    };

    const generateEan = () => {
      const gen = new Set(generatedEans);
      const newItems = items.map((it) => {
        const key = getKey(it);
        if (selectedIds.has(key) && (!it.ean || !isValidEan13(it.ean)) && it.articleNumber) {
          const e = fromArticleToEan13(it.articleNumber);
          if (e) {
            gen.add(key);
            return { ...it, ean: e };
          }
        }
        return it;
      });
      setItems(newItems);
      setGeneratedEans(gen);
    };

    const createSchema = z.object({
      articleNumber: z
        .string()
        .trim()
        .refine(
          (v) => /^[A-Za-z0-9_-]{1,15}$/.test(v),
          {
            message:
              'Artikelnummer darf Buchstaben und Ziffern enthalten (A–Z, 0–9, _ , -), max. 15 Zeichen.',
          },
        )
        .optional(),
      name: z.string().min(1),
      ean: z
        .string()
        .optional()
        .refine((v) => !v || isValidEan13(v), {
          message: 'EAN-13 ungültig',
        }),
      price: z.preprocess(
        (v) => (v === '' ? undefined : Number(v)),
        z.number().nonnegative().optional(),
      ),
      unit: z.string().optional(),
    });

    const handleCreate = async () => {
      const data = {
        articleNumber: artnr || undefined,
        name,
        ean: autoEan && !ean ? fromArticleToEan13(artnr) || '' : ean,
        price,
        unit,
      };
      const parsed = createSchema.safeParse(data);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0].message);
        return;
      }
      setFormError(null);
      const payload = { ...parsed.data, price: parsed.data.price ?? 0 };
      const res = await window.bridge?.customCreate?.(payload);
      if (res && addToCart) {
        setCart((prev) => [...prev, { source: 'custom', id: res.id, ...payload, qty: 1 }]);
      }
      setArtnr('');
      setName('');
      setEan('');
      setPrice('');
      setUnit('');
      setAddToCart(true);
      setAutoEan(true);
      setEanDirty(false);
      await refreshList();
    };

    const incQty = (idx: number) => {
      setCart((prev) => {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      });
    };

    const decQty = (idx: number) => {
      setCart((prev) => {
        const next = [...prev];
        next[idx].qty -= 1;
        if (next[idx].qty <= 0) next.splice(idx, 1);
        return next;
      });
    };

    const removeCart = (idx: number) => {
      setCart((prev) => prev.filter((_, i) => i !== idx));
    };

    const totalSelected = selectedIds.size;

  return (
    <div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {dbInfoText && <div>{dbInfoText}</div>}
          <Input
            value={query}
            onChange={(_, d) => setQuery(d.value)}
            onKeyDown={onKeyDown}
            placeholder="Suche"
            disabled={!apiReady || loading}
          />
          <Button onClick={onSearch} disabled={!apiReady || loading}>
            Suchen
          </Button>
          <Button
            onClick={async () => {
              await window.bridge?.dbClear?.();
              await loadInfo();
              await refreshList(1);
            }}
            disabled={!apiReady || loading}
          >
            Leeren
          </Button>
        </div>
      {!apiReady && (
        <div style={{ background: '#fdd835', padding: '8px', marginTop: '8px' }}>
          Bridge nicht initialisiert – bitte als Electron-App starten
        </div>
      )}
      {loading && <div>Suche…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && loaded && items.length === 0 && <div>Keine Treffer</div>}
      {items.length > 0 && (
        <div>
            <div style={{ margin: '8px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>
                {start}–{end} von {total}
              </span>
              {totalSelected > 0 && <span>{totalSelected} Einträge ausgewählt</span>}
              <Button onClick={addSelectionToCart} disabled={totalSelected === 0}>
                Auswahl in Warenkorb
              </Button>
              <Button onClick={generateEan} disabled={totalSelected === 0}>
                EAN aus Artikelnummer erzeugen
              </Button>
            </div>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th onClick={() => toggleSort('articleNumber')} style={{ cursor: 'pointer' }}>
                    Artikelnummer
                  {sortBy === 'articleNumber'
                    ? sortDir === 'ASC'
                      ? ' ▲'
                      : ' ▼'
                    : ''}
                </th>
                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                  Name
                  {sortBy === 'name'
                    ? sortDir === 'ASC'
                      ? ' ▲'
                      : ' ▼'
                    : ''}
                </th>
                <th>EAN</th>
                <th onClick={() => toggleSort('price')} style={{ cursor: 'pointer' }}>
                  Preis
                  {sortBy === 'price'
                    ? sortDir === 'ASC'
                      ? ' ▲'
                      : ' ▼'
                    : ''}
                </th>
                <th>Einheit</th>
                <th>Gruppe</th>
              </tr>
            </thead>
              <tbody>
                {items.map((it) => {
                  const key = getKey(it);
                  return (
                    <tr key={key} onClick={() => toggleSelect(key)} style={{ cursor: 'pointer' }}>
                      <td>
                        <Checkbox
                          checked={selectedIds.has(key)}
                          onChange={() => toggleSelect(key)}
                        />
                      </td>
                      <td>{it.articleNumber || ''}</td>
                      <td>{it.name}</td>
                      <td>{it.ean || ''}</td>
                      <td>{it.price != null ? currency.format(it.price) : '–'}</td>
                      <td>{it.unit || ''}</td>
                      <td>{it.productGroup || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          <div style={{ marginTop: '8px' }}>
            <Button onClick={prev} disabled={!apiReady || loading || page <= 1}>
              Zurück
            </Button>
            <Button
              onClick={next}
              disabled={!apiReady || loading || page * pageSize >= total}
            >
              Weiter
            </Button>
          </div>
        </div>
        )}
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h3>Artikel manuell anlegen</h3>
            {formError && <div style={{ color: 'red' }}>{formError}</div>}
            <Input
              type="text"
              value={artnr}
              onChange={(_, d) => setArtnr(d.value)}
              placeholder="Artikelnummer (optional)"
            />
            <Input
              value={name}
              onChange={(_, d) => setName(d.value)}
              placeholder="Name"
            />
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Input
                value={ean}
                onChange={(_, d) => {
                  setEanDirty(true);
                  setEan(onlyDigits(d.value));
                }}
                placeholder="EAN (optional)"
                style={
                  ean
                    ? { borderColor: isValidEan13(ean) ? 'green' : 'red' }
                    : undefined
                }
              />
              {!autoEan && (
                <Button
                  onClick={() => {
                    setEan(fromArticleToEan13(artnr) || '');
                    setEanDirty(false);
                  }}
                  title="EAN neu aus Artikelnummer berechnen"
                >
                  ↻ aus Art.-Nr.
                </Button>
              )}
            </div>
            <div
              style={{
                fontSize: '0.8em',
                color: ean
                  ? isValidEan13(ean)
                    ? 'green'
                    : 'red'
                  : undefined,
              }}
            >
              {ean === ''
                ? 'EAN leer (optional)'
                : isValidEan13(ean)
                ? 'EAN gültig ✓'
                : 'EAN ungültig (13 Ziffern, Prüfziffer beachten)'}
            </div>
            <Checkbox
              checked={autoEan}
              onChange={(_, d) => {
                const checked = !!d.checked;
                setAutoEan(checked);
                if (checked) {
                  setEanDirty(false);
                  setEan(fromArticleToEan13(artnr) || '');
                }
              }}
              label="EAN automatisch aus Art.-Nr."
            />
            <Input
              value={price}
              onChange={(_, d) => setPrice(d.value)}
              placeholder="Preis (optional)"
            />
            <Input
              value={unit}
              onChange={(_, d) => setUnit(d.value)}
              placeholder="Einheit (optional)"
            />
            <Checkbox
              checked={addToCart}
              onChange={(_, d) => setAddToCart(d.checked)}
              label="nach Anlage in Warenkorb übernehmen"
            />
            <Button onClick={handleCreate}>Anlegen</Button>
            <div style={{ fontSize: '0.8em', marginTop: '8px' }}>
              GS1-konforme EANs werden offiziell vergeben. Die hier aus Artikelnummern generierten Codes sind nicht für den
              Handel bestimmt.
            </div>
          </div>
          <div style={{ width: '300px' }}>
            <h3>Warenkorb</h3>
            <ul>
              {cart.map((c, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
                  <div>{c.name}</div>
                  <div style={{ fontSize: '0.8em' }}>{c.articleNumber || ''}</div>
                  <div style={{ fontSize: '0.8em' }}>
                    {c.ean || ''} {c.generated ? '(gen.)' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Button onClick={() => decQty(idx)}>-</Button>
                    <span>{c.qty}</span>
                    <Button onClick={() => incQty(idx)}>+</Button>
                    <Button onClick={() => removeCart(idx)}>Entfernen</Button>
                  </div>
                </li>
              ))}
            </ul>
            {cart.length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label>Vorlage:</label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as keyof typeof templates)}
                  >
                    <option value="a4-3x8">A4 3×8 (63,5×38,1)</option>
                    <option value="a4-3x7">A4 3×7 (70×37)</option>
                    <option value="a4-2x7">A4 2×7 (99×38)</option>
                  </select>
                  <label>BarcodeH:</label>
                  <input
                    type="number"
                    value={barcodeH}
                    onChange={(e) => setBarcodeH(parseFloat(e.target.value) || 0)}
                    style={{ width: '60px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button onClick={onPdf}>PDF-Etiketten erzeugen</Button>
                  <Button onClick={() => setCart([])}>Warenkorb leeren</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default ArticleSearch;

