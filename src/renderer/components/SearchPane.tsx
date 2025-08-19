import React, { useState } from 'react';
import { Button, Input } from '@fluentui/react-components';

const SearchPane: React.FC = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const doSearch = async () => {
    const res = await window.api.search(q, 0, 20);
    setResults(res);
  };
  return (
    <div>
      <Input value={q} onChange={(_, d) => setQ(d.value)} placeholder="Suche" />
      <Button onClick={doSearch}>Suchen</Button>
      <ul>
        {results.map((r) => (
          <li key={r.id}>{r.shortText}</li>
        ))}
      </ul>
    </div>
  );
};

export default SearchPane;
