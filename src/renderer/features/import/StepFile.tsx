import React from 'react';
import { parseCsv } from './parsers/csv';
import { parseXlsx } from './parsers/xlsx';
import { parseTxt } from './parsers/txt';
import type { ParsedFile } from './types';

type Props = { onParsed: (data: ParsedFile) => void; };

const StepFile: React.FC<Props> = ({ onParsed }) => {
  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    let parsed: ParsedFile;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) parsed = await parseXlsx(file);
    else if (name.endsWith('.txt')) parsed = await parseTxt(file);
    else parsed = await parseCsv(file);
    onParsed(parsed);
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv,.txt,.tsv,.xlsx,.xls"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
    </div>
  );
};

export default StepFile;
