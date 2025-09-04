import { db } from '../db';

export interface ImportRow {
  articleNumber: string;
  ean?: string | null;
  name?: string | null;
  price?: number | null;
  unit?: string | null;
  productGroup?: string | null;
  category?: string | null;
}

export interface ImportArgs {
  rows: ImportRow[];
  dryRun?: boolean;
  onProgress?: (p: { processed: number; total: number }) => void;
  shouldCancel?: () => boolean;
}

export interface ImportSummary {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { rowIndex: number; articleNumber?: string; message: string }[];
}

function resolveCategoryId(cat: string | null | undefined): number | null {
  if (!cat) return null;
  const num = Number(cat);
  if (!Number.isNaN(num)) return num;
  const trimmed = String(cat).trim();
  const found = db.prepare('SELECT id FROM categories WHERE name=?').get(trimmed) as
    | { id: number }
    | undefined;
  if (found) return found.id;
  const res = db.prepare('INSERT INTO categories (name) VALUES (?)').run(trimmed);
  return Number(res.lastInsertRowid);
}

export function importArticles({ rows, dryRun = false, onProgress, shouldCancel }: ImportArgs): ImportSummary {
  const total = rows.length;
  const summary: ImportSummary = { total, inserted: 0, updated: 0, skipped: 0, errors: [] };
  if (dryRun || total === 0) return summary;

  const processedRows = rows.map((r) => {
    const out: Record<string, unknown> = { articleNumber: r.articleNumber };
    if ('ean' in r) out.ean = r.ean ?? null;
    if ('name' in r) out.name = r.name ?? null;
    if ('price' in r) out.price = r.price ?? null;
    if ('unit' in r) out.unit = r.unit ?? null;
    if ('productGroup' in r) out.productGroup = r.productGroup ?? null;
    if ('category' in r) out.category_id = resolveCategoryId(r.category ?? null);
    return out as Record<string, unknown> & { articleNumber: string };
  });

  const fieldSet = new Set<string>();
  processedRows.forEach((r) => {
    Object.keys(r).forEach((k) => {
      if (k !== 'articleNumber') fieldSet.add(k);
    });
  });
  const fields = Array.from(fieldSet);

  processedRows.forEach((r) => {
    fields.forEach((f) => {
      if (!(f in r)) (r as Record<string, unknown>)[f] = null;
    });
  });

  const columns = ['articleNumber', ...fields, 'updated_at'];
  const values = ['@articleNumber', ...fields.map((f) => `@${f}`), 'CURRENT_TIMESTAMP'];
  const updates = fields.map((f) => `${f}=excluded.${f}`).concat('updated_at=excluded.updated_at');
  const stmt = db.prepare(
    `INSERT INTO articles (${columns.join(',')}) VALUES (${values.join(',')}) ON CONFLICT(articleNumber) DO UPDATE SET ${updates.join(',')}`,
  );

  const exists = db.prepare('SELECT 1 FROM articles WHERE articleNumber = ?');

  const tx = db.transaction((all: typeof processedRows) => {
    let processed = 0;
    const CHUNK = 500;
    for (let i = 0; i < all.length; i += CHUNK) {
      if (shouldCancel?.()) break;
      const part = all.slice(i, i + CHUNK);
      part.forEach((r, idx) => {
        try {
          const was = exists.get(r.articleNumber);
          stmt.run(r);
          if (was) summary.updated += 1;
          else summary.inserted += 1;
        } catch (e: any) {
          summary.errors.push({ rowIndex: i + idx, articleNumber: r.articleNumber, message: e.message });
          summary.skipped += 1;
        }
      });
      processed += part.length;
      onProgress?.({ processed, total });
      if (shouldCancel?.()) break;
    }
  });

  tx(processedRows);

  return summary;
}
