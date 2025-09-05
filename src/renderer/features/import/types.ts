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
  | 'category_id';

// maps target fields to column names from the source file
export type Mapping = Partial<Record<MappingField, string>>;

// row object limited to the mapped target fields
export type PreviewRow = Record<string, unknown>;

export type ImportError = {
  row: number;
  code?: number;
  message: string;
  sql: string;
  params: Record<string, any>;
};

export type ImportResult = {
  ok: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  fatal?: string;
};
