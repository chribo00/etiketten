import { runImport, type ImportResult } from './importer';

export interface DatanormImportOptions {
  input: string;
  supplierName?: string;
  dryRun?: boolean;
  onProgress?: (info: { file: string; line: number; ok: number; skipped: number; errors: number }) => void;
  version?: 'v4' | 'v5' | 'auto';
}

export type { ImportResult };

export async function importDatanorm(opts: DatanormImportOptions): Promise<ImportResult> {
  const options = { version: 'auto', dryRun: false, ...opts } as DatanormImportOptions;
  return runImport(options);
}
