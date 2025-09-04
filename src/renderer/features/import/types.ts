export type ParsedFile = {
  headers: string[];
  rows: any[][];
};

export type MappingField =
  | 'articleNumber'
  | 'ean'
  | 'name'
  | 'price'
  | 'unit'
  | 'productGroup'
  | 'category';

export type Mapping = Partial<Record<MappingField, string | null>>;

export type RawImportRow = {
  articleNumber: unknown;
  ean?: unknown;
  name?: unknown;
  price?: unknown;
  unit?: unknown;
  productGroup?: unknown;
  category?: unknown;
};

export type ImportRow = {
  articleNumber: string;
  ean?: string | null;
  name?: string | null;
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
