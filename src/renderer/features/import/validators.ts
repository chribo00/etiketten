export function normalizeString(v: unknown): string {
  return String(v ?? '').trim();
}

export function normalizePrice(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).replace(',', '.');
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

import type { RawImportRow, ImportRow, Mapping } from './types';

export type RowIssue = { rowIndex: number; warnings: string[]; errors: string[] };

export function validateRows(rows: RawImportRow[], mapping: Mapping) {
  const issues: RowIssue[] = [];
  const result: ImportRow[] = [];
  const stats = { ok: 0, warn: 0, error: 0 };
  const seen = new Set<string>();

  rows.forEach((r, idx) => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const articleNumber = normalizeString(r.articleNumber);
    if (!articleNumber) {
      errors.push('Artikelnummer fehlt');
    } else if (seen.has(articleNumber)) {
      errors.push('Artikelnummer doppelt');
    } else {
      seen.add(articleNumber);
    }

    const row: ImportRow = { articleNumber };

    if (mapping.ean !== undefined && mapping.ean !== null) {
      const ean = normalizeString(r.ean);
      row.ean = ean || null;
    }

    if (mapping.name !== undefined && mapping.name !== null) {
      const name = normalizeString(r.name);
      if (!name) warnings.push('Name fehlt, wird als leer gespeichert');
      row.name = name || null;
    }

    if (mapping.price !== undefined && mapping.price !== null) {
      const parsed = normalizePrice(r.price);
      if (parsed === null && normalizeString(r.price).length > 0) {
        errors.push('Preis ungültig');
      }
      row.price = parsed;
    }

    if (mapping.unit !== undefined && mapping.unit !== null) {
      const unit = normalizeString(r.unit);
      row.unit = unit || null;
    }

    if (mapping.productGroup !== undefined && mapping.productGroup !== null) {
      const pg = normalizeString(r.productGroup);
      row.productGroup = pg || null;
    }

    if (mapping.category !== undefined && mapping.category !== null) {
      const cat = normalizeString(r.category);
      row.category = cat || null;
    }

    issues.push({ rowIndex: idx, warnings, errors });
    if (errors.length > 0) stats.error += 1;
    else if (warnings.length > 0) stats.warn += 1;
    else stats.ok += 1;

    result.push(row);
  });

  return { rows: result, issues, stats };
}
