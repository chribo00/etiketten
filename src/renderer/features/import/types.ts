export type ParsedFile = {
  headers: string[];
  rows: any[][];
};

export type Mapping = Record<string, string>;

export type ImportRow = {
  articleNumber: string;
  ean?: string | null;
  name: string;
  price?: number | null;
  unit?: string | null;
  productGroup?: string | null;
  category?: string | null;
};

export type ImportSummary = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { rowIndex: number; articleNumber?: string; message: string }[];
};
