import { db } from '../db';
import type { ArticleRow } from '../db';

export interface ImportArgs {
  rows: ArticleRow[];
  dryRun?: boolean;
  onProgress?: (p: { processed: number; total: number }) => void;
}

export interface ImportSummary {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { rowIndex: number; articleNumber?: string; message: string }[];
}

export function importArticles({ rows, dryRun = false, onProgress }: ImportArgs): ImportSummary {
  const total = rows.length;
  const summary: ImportSummary = { total, inserted: 0, updated: 0, skipped: 0, errors: [] };
  if (dryRun || total === 0) return summary;

  const stmt = db.prepare(`
INSERT INTO articles (
  articleNumber, ean, name, price, unit, productGroup, category_id, updated_at
) VALUES (
  @articleNumber, @ean, @name, @price, @unit, @productGroup, @category_id, CURRENT_TIMESTAMP
)
ON CONFLICT(articleNumber) DO UPDATE SET
  ean=excluded.ean,
  name=excluded.name,
  price=excluded.price,
  unit=excluded.unit,
  productGroup=excluded.productGroup,
  category_id=excluded.category_id,
  updated_at=excluded.updated_at
`);
  const exists = db.prepare('SELECT 1 FROM articles WHERE articleNumber = ?');

  const tx = db.transaction((all: ArticleRow[]) => {
    let processed = 0;
    const CHUNK = 500;
    for (let i = 0; i < all.length; i += CHUNK) {
      const part = all.slice(i, i + CHUNK);
      part.forEach((r, idx) => {
        try {
          const was = exists.get(r.articleNumber);
          stmt.run(r);
          if (was) summary.updated += 1; else summary.inserted += 1;
        } catch (e: any) {
          summary.errors.push({ rowIndex: i + idx, articleNumber: r.articleNumber, message: e.message });
          summary.skipped += 1;
        }
      });
      processed += part.length;
      onProgress?.({ processed, total });
    }
  });

  tx(rows);

  return summary;
}
