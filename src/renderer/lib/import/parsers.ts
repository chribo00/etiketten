import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function parseFile(file: File): Promise<{ headers: string[]; rows: any[]; dialect: { delimiter: string; quoteChar?: string; hasHeader: boolean } }> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false });
    const headers = rows.shift() as string[];
    return { headers, rows: rows as any[], dialect: { delimiter: ',', hasHeader: true } };
  }

  // CSV/TXT
  const text = await file.text();
  const parsed = Papa.parse(text, { dynamicTyping: true, skipEmptyLines: true, delimiter: Papa.parse(text, { preview: 1 }).meta.delimiter });
  const [headers, ...rows] = parsed.data as any[];
  return { headers, rows, dialect: { delimiter: parsed.meta.delimiter || ',', hasHeader: true } };
}

