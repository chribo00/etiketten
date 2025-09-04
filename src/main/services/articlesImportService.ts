import { db, type ArticleRow } from '../db';
type Statement = ReturnType<typeof db.prepare>;

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
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { rowIndex: number; articleNumber?: string; message: string }[];
  cancelled: boolean;
}

function resolveCategory(
  cat: string | null | undefined,
): { id: number | null; name: string | null } {
  if (!cat) return { id: null, name: null };
  const num = Number(cat);
  if (!Number.isNaN(num)) return { id: num, name: null };
  const trimmed = String(cat).trim();
  const found = db
    .prepare('SELECT id FROM categories WHERE name=?')
    .get(trimmed) as { id: number } | undefined;
  if (found) return { id: found.id, name: trimmed };
  const res = db.prepare('INSERT INTO categories (name) VALUES (?)').run(trimmed);
  return { id: Number(res.lastInsertRowid), name: trimmed };
}

export function buildUpsertForRow(mappedRow: Partial<ArticleRow>) {
  if (!('articleNumber' in mappedRow)) throw new Error('articleNumber required');
  const cols = Object.keys(mappedRow) as (keyof ArticleRow)[];
  const insertCols = [...cols, 'updated_at'];
  const values = [...cols.map((c) => `@${c}`), 'CURRENT_TIMESTAMP'];
  const updateCols = cols.filter((c) => c !== 'articleNumber');
  const updates = [
    ...updateCols.map((c) => `${String(c)}=excluded.${String(c)}`),
    'updated_at=excluded.updated_at',
  ];
  const params = cols.reduce<Record<string, unknown>>((acc, c) => {
    acc[c] = (mappedRow as Record<string, unknown>)[c];
    return acc;
  }, {});
  const sql = `INSERT INTO articles (${insertCols.join(',')}) VALUES (${values.join(',')}) ON CONFLICT(articleNumber) DO UPDATE SET ${updates.join(',')}`;
  return { sql, params, columns: insertCols, updateCols };
}

export function importArticles({
  rows,
  dryRun = false,
  onProgress,
  shouldCancel,
}: ImportArgs): ImportSummary {
  const total = rows.length;
  const summary: ImportSummary = {
    total,
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    cancelled: false,
  };
  if (dryRun || total === 0) return summary;

  try {
    const tableInfo = db.prepare('PRAGMA table_info(articles)').all() as {
      name: string;
      notnull: number;
      type: string;
    }[];
    const idxList = db.prepare('PRAGMA index_list(articles)').all() as { name: string }[];
    console.debug(
      '[import] table_info(articles) =>',
      tableInfo.map((c) => ({ name: c.name, notnull: c.notnull, type: c.type })),
    );
    console.debug('[import] index_list(articles) =>', idxList);
  } catch (e) {
    console.warn('[import] pragma failed', e);
  }

  const existsStmt = db.prepare('SELECT rowid FROM articles WHERE articleNumber=?');

  const hasFts = !!db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='articles_fts'")
    .get();
  const triggers = hasFts
    ? db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='articles' AND name LIKE '%articles_fts%'",
        )
        .all()
    : [];
  const useFTSDirectWrite = hasFts && triggers.length === 0;

  let deleteFts: Statement | undefined;
  let insertFts: Statement | undefined;
  let ftsCols: string[] = [];

  if (useFTSDirectWrite) {
    const info = db.prepare('PRAGMA table_info(articles_fts)').all() as { name: string }[];
    const desired = [
      'articleNumber',
      'name',
      'kurztext2',
      'langtext',
      'matchcode',
      'ean',
      'supplierName',
      'category_name',
    ];
    ftsCols = desired.filter((c) => info.some((i) => i.name === c));
    const placeholders = ftsCols.map(() => '?').join(', ');
    insertFts = db.prepare(
      `INSERT INTO articles_fts(rowid, ${ftsCols.join(',')}) VALUES (?, ${placeholders})`,
    );
    deleteFts = db.prepare('DELETE FROM articles_fts WHERE rowid = ?');
  }

  let firstErrorLogged = false;
  const CHUNK = 200;

  for (let i = 0; i < rows.length; i += CHUNK) {
    if (shouldCancel?.()) {
      summary.cancelled = true;
      break;
    }
    const part = rows.slice(i, i + CHUNK);
    const tx = db.transaction((chunk: ImportRow[], offset: number) => {
      chunk.forEach((r, idx) => {
        if (summary.cancelled) return;
        const row: Partial<ArticleRow> = { articleNumber: r.articleNumber };
        if ('ean' in r) row.ean = r.ean ?? null;
        if ('name' in r) row.name = r.name ?? null;
        if ('price' in r) row.price = r.price ?? null;
        if ('unit' in r) row.unit = r.unit ?? null;
        if ('productGroup' in r) row.productGroup = r.productGroup ?? null;
        let categoryName: string | null = null;
        if ('category' in r) {
          const { id, name } = resolveCategory(r.category ?? null);
          row.category_id = id;
          categoryName = name;
        }

        const { sql, params, columns, updateCols } = buildUpsertForRow(row);
        if (summary.processed === 0) {
          console.debug('[import] cols', columns, 'updateCols', updateCols);
        }
        const stmt = db.prepare(sql);
        try {
          const existing = existsStmt.get(r.articleNumber) as { rowid: number } | undefined;
          const res = stmt.run(params);
          const rowid = existing?.rowid ?? Number(res.lastInsertRowid);
          if (existing) summary.updated += 1;
          else summary.inserted += 1;

          if (useFTSDirectWrite && insertFts && deleteFts) {
            deleteFts.run(rowid);
            const vals = ftsCols.map((c) => {
              switch (c) {
                case 'articleNumber':
                  return r.articleNumber;
                case 'name':
                  return row.name ?? '';
                case 'kurztext2':
                  return '';
                case 'langtext':
                  return '';
                case 'matchcode':
                  return '';
                case 'ean':
                  return row.ean ?? '';
                case 'supplierName':
                  return '';
                case 'category_name':
                  return categoryName ?? '';
                default:
                  return '';
              }
            });
            insertFts.run(rowid, ...vals);
          }
        } catch (e) {
          const err = e as Error;
          summary.errors.push({
            rowIndex: offset + idx,
            articleNumber: r.articleNumber,
            message: err.message,
          });
          summary.skipped += 1;
          if (!firstErrorLogged) {
            const columnsPresent = Object.keys(row);
            const valuesPresent = columnsPresent.map((c) => (row as Record<string, unknown>)[c]);
            console.error('[import] row fail', {
              row: offset + idx,
              columnsPresent,
              valuesPresent,
              sql,
              message: err.message,
            });
            firstErrorLogged = true;
          }
        }

        summary.processed += 1;
        onProgress?.({ processed: summary.processed, total });
        if (shouldCancel?.()) summary.cancelled = true;
      });
    });
    tx(part, i);
    if (summary.cancelled) break;
  }

  return summary;
}

