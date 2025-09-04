import type { ParsedFile } from '../types';
import { parseCsv } from './csv';

export async function parseTxt(file: File): Promise<ParsedFile> {
  return parseCsv(file);
}
