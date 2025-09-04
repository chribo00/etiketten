import * as XLSX from 'xlsx';
import type { ParsedFile } from '../types';

export async function parseXlsx(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false });
  const headers = (rows.shift() as string[]) || [];
  return { headers, rows: rows as any[][] };
}
