import React, { useState } from 'react';
import { Button, Input } from '@fluentui/react-components';
import type { LabelOptions } from './LabelOptionsPane';

interface Props {
  defaultOpts: LabelOptions;
  onAdded?: () => void;
}

const PAGE_SIZE = 50;

const SearchPane: React.FC<Props> = ({ defaultOpts, onAdded }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [qty, setQty] = useState<Record<string, number>>({});

  const load = async (p = page) => {
    const res = await window.bridge?.search?.(q, p, PAGE_SIZE);
    setResults(res?.items || []);
  };

  const doSearch = async () => {
    setPage(0);
    await load(0);
  };

  const add = async (id: string) => {
    const n = qty[id] || 1;
    await window.bridge?.cart?.add?.({ articleId: id, qty: n, opts: defaultOpts });
    if (onAdded) onAdded();
  };

  const apiReady = !!window.bridge?.ready;

  return (
    <div>
      <div>{apiReady ? 'Bridge initialisiert' : 'Bridge nicht initialisiert'}</div>
      <Input value={q} onChange={(_, d) => setQ(d.value)} placeholder="Suche" />
      <Button onClick={doSearch} disabled={!apiReady}>
        Suchen
      </Button>
      <table>
        <thead>
          <tr>
            <th>Artikelnummer</th>
            <th>Kurztext</th>
            <th>EAN</th>
            <th>Preis</th>
            <th>Menge</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.articleNumber}</td>
              <td>{r.shortText}</td>
              <td>{r.ean}</td>
              <td>{r.listPrice}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={qty[r.id] || 1}
                  onChange={(e) => setQty({ ...qty, [r.id]: Number(e.target.value) })}
                  style={{ width: 50 }}
                />
              </td>
              <td>
                <Button size="small" onClick={() => add(r.id)} disabled={!apiReady}>
                  + Warenkorb
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <Button
          onClick={async () => {
            const p = Math.max(0, page - 1);
            setPage(p);
            await load(p);
          }}
          disabled={!apiReady || page === 0}
        >
          Zurück
        </Button>
        <Button
          onClick={async () => {
            const p = page + 1;
            setPage(p);
            await load(p);
          }}
          disabled={!apiReady || results.length < PAGE_SIZE}
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default SearchPane;
