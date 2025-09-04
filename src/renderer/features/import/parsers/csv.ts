import Papa from 'papaparse';
import type { ParsedFile } from '../types';

export async function parseCsv(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const [headers, ...rows] = parsed.data as string[][];
  return { headers: headers || [], rows };
}
