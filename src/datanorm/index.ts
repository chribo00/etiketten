import { runImport } from './importer';

export interface DatanormImportOptions {
  input: string;
  supplierName?: string;
  dryRun?: boolean;
  onProgress?: (info: { file: string; line: number; ok: number; skipped: number; errors: number }) => void;
  version?: 'v4' | 'v5' | 'auto';
}

export interface ImportResult {
  version: 'v4' | 'v5';
  filesProcessed: string[];
  counts: {
    articles: number;
    texts: number;
    warengruppen: number;
    rabattgruppen: number;
    prices: number;
    priceTiers: number;
    media: number;
    sets: number;
    errors: number;
  };
  reportPath: string;
}

export async function importDatanorm(opts: DatanormImportOptions): Promise<ImportResult> {
  const options = { version: 'auto', dryRun: false, ...opts } as DatanormImportOptions;
  return runImport(options);
}
