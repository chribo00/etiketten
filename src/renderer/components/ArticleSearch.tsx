import React, { useState } from 'react';
import { Button, Input } from '@fluentui/react-components';

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

  const fetch = async (
    p = page,
    sb: 'name' | 'articleNumber' | 'price' = sortBy,
    sd: 'ASC' | 'DESC' = sortDir,
  ) => {
    if (!window.bridge?.searchArticles) return;
    setLoading(true);
    setError(null);
    const offset = (p - 1) * pageSize;
    try {
      const res = await window.bridge.searchArticles({
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
  };

  const onSearch = async () => {
    setPage(1);
    await fetch(1);
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
    await fetch(p);
  };

  const next = async () => {
    const p = page + 1;
    setPage(p);
    await fetch(p);
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
    await fetch(1, col, dir);
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, (page - 1) * pageSize + items.length);

  const apiReady = window.bridge?.ready === true;

  return (
    <div>
      <div>
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
      </div>
      {!apiReady && (
        <div style={{ background: '#fdd835', padding: '8px', marginTop: '8px' }}>
          Bridge nicht initialisiert – bitte als Electron-App starten
        </div>
      )}
      {loading && <div>Suche…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && items.length === 0 && query && !error && <div>Keine Treffer</div>}
      {items.length > 0 && (
        <div>
          <div style={{ margin: '8px 0' }}>
            {start}–{end} von {total}
          </div>
          <table>
            <thead>
              <tr>
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
              {items.map((it) => (
                <tr key={it.articleNumber}>
                  <td>{it.articleNumber || ''}</td>
                  <td>{it.name}</td>
                  <td>{it.ean || ''}</td>
                  <td>{it.price != null ? currency.format(it.price) : '–'}</td>
                  <td>{it.unit || ''}</td>
                  <td>{it.productGroup || ''}</td>
                </tr>
              ))}
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
    </div>
  );
};

export default ArticleSearch;

