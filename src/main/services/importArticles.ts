import Database from 'better-sqlite3';
import { db } from '../db';

type MappedCols = {
  articleNumber?: string;
  ean?: string;
  name?: string;
  price?: string;
  unit?: string;
  productGroup?: string;
  category?: string;
};

export async function importArticles({ rows, mappedColumns }: { rows: any[]; mappedColumns: MappedCols }) {
  // log schema info once
  if (!schemaLogged) {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(articles)`).all();
      const indexList = db.prepare(`PRAGMA index_list('articles')`).all();
      console.log(
        '[import] table_info(articles) =>',
        tableInfo.map(({ name, notnull, type }) => ({ name, notnull, type })),
      );
      console.log('[import] index_list(articles) =>', indexList);
    } catch {}
    schemaLogged = true;
  }

  const columnMap: Record<string, string> = {};
  (
    [
      'articleNumber',
      'ean',
      'name',
      'price',
      'unit',
      'productGroup',
      'category',
    ] as const
  ).forEach((key) => {
    const src = mappedColumns[key];
    if (src) columnMap[key] = src;
  });

  if (Object.keys(columnMap).length === 0) {
    const errorsCsv = makeErrorsCsv(rows.map((_r: any, i: number) => ({ row: i, message: 'Kein Feld gemappt' })));
    return {
      okCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: rows.length,
      errorsCsv,
    };
  }

  const hasKeyArticleNumber = !!columnMap.articleNumber;
  const hasKeyEan = !!columnMap.ean;
  const idxOnEan = tryFindUniqueIndexOn(db, 'articles', 'ean');
  const conflictsOn = hasKeyArticleNumber
    ? 'articleNumber'
    : hasKeyEan && idxOnEan
    ? 'ean'
    : null;

  const errors: Array<{ row: number; message: string; sql?: string; values?: any }> = [];
  let insertedCount = 0,
    updatedCount = 0,
    okCount = 0,
    skippedCount = 0;

  const checkStmt = conflictsOn
    ? db.prepare(`SELECT 1 FROM articles WHERE ${conflictsOn}=? LIMIT 1`)
    : null;

  const tx = db.transaction((items: any[]) => {
    function buildRowParams(src: any) {
      const vals: Record<string, any> = {};
      if (columnMap.articleNumber) vals.articleNumber = clean(src[columnMap.articleNumber]);
      if (columnMap.ean) vals.ean = clean(src[columnMap.ean]);
      if (columnMap.name) vals.name = clean(src[columnMap.name]);
      if (columnMap.price) vals.price = normalizeNumber(src[columnMap.price]);
      if (columnMap.unit) vals.unit = clean(src[columnMap.unit]);
      if (columnMap.productGroup) vals.productGroup = clean(src[columnMap.productGroup]);
      if (columnMap.category) {
        const catName = clean(src[columnMap.category]);
        vals.category_id = resolveCategoryId(db, catName);
      }
      return vals;
    }

    for (let i = 0; i < items.length; i++) {
      const src = items[i];
      const values = buildRowParams(src);
      if (Object.keys(values).length === 0) {
        skippedCount++;
        continue;
      }

      const targetCols = Object.keys(values);
      const namedCols = targetCols.map((c) => `@${c}`);
      const setList = targetCols.filter((c) => c !== conflictsOn).map((c) => `${c}=excluded.${c}`);
      targetCols.push('updated_at');
      namedCols.push('CURRENT_TIMESTAMP');
      let sql: string;
      if (conflictsOn) {
        sql = `INSERT INTO articles (${targetCols.join(',')}) VALUES (${namedCols.join(',')}) ON CONFLICT(${conflictsOn}) DO UPDATE SET ${[...setList, 'updated_at=excluded.updated_at'].join(',')}`;
      } else {
        sql = `INSERT INTO articles (${targetCols.join(',')}) VALUES (${namedCols.join(',')})`;
      }

      const exists = conflictsOn && checkStmt ? !!checkStmt.get(values[conflictsOn]) : false;

      try {
        const stmt = db.prepare(sql);
        const info = stmt.run(values);
        if (info.changes) okCount++;
        if (conflictsOn) {
          if (exists) updatedCount++;
          else insertedCount++;
        } else {
          insertedCount++;
        }
      } catch (err: any) {
        if (String(err?.message || '').includes('SQL logic error') && conflictsOn) {
          try {
            const setPairs = targetCols
              .filter((c) => c !== conflictsOn)
              .map((c) => `${c}=@${c.replace('updated_at', 'updated_at_val')}`);
            const updParams: any = { ...values, updated_at_val: new Date().toISOString() };
            const upd = db
              .prepare(`UPDATE articles SET ${setPairs.join(',')} WHERE ${conflictsOn}=@${conflictsOn}`)
              .run(updParams);
            if (upd.changes === 0) {
              const insCols = Object.keys(values).concat('updated_at');
              const insVals = insCols.map((c) => (c === 'updated_at' ? 'CURRENT_TIMESTAMP' : `@${c}`));
              db.prepare(`INSERT INTO articles (${insCols.join(',')}) VALUES (${insVals.join(',')})`).run(values);
              insertedCount++;
              okCount++;
            } else {
              updatedCount++;
              okCount++;
            }
          } catch (e2: any) {
            errors.push({ row: i, message: String(e2?.message || e2), sql, values });
          }
        } else {
          errors.push({ row: i, message: String(err?.message || err), sql, values });
        }
      }
    }
  });

  try {
    tx(rows);
  } catch (e: any) {
    for (let i = 0; i < rows.length; i++) errors.push({ row: i, message: `TX failed: ${String(e?.message || e)}` });
  }

  const errorCount = errors.length;
  const errorsCsv = makeErrorsCsv(errors);
  return { okCount, insertedCount, updatedCount, skippedCount, errorCount, errorsCsv };
}

let schemaLogged = false;

function clean(v: any) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}
function normalizeNumber(v: any) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return isFinite(n) ? n : null;
}

function tryFindUniqueIndexOn(db: Database, table: string, col: string) {
  try {
    const idx = db.prepare(`PRAGMA index_list('${table}')`).all();
    for (const it of idx) {
      const info = db.prepare(`PRAGMA index_info('${it.name}')`).all();
      const cols = info.map((r: any) => r.name);
      if (cols.length === 1 && cols[0] === col && (it as any).unique === 1) return (it as any).name;
    }
  } catch {}
  return null;
}

function resolveCategoryId(db: Database, name: string | null) {
  if (!name) return null;
  const row = db.prepare(`SELECT id FROM categories WHERE name=?`).get(name);
  return row?.id ?? null;
}

function makeErrorsCsv(items: { row: number; message: string; sql?: string; values?: any }[]) {
  const header = 'row;message;sql;values\n';
  const lines = items.map((e) => [
    e.row,
    JSON.stringify(e.message || ''),
    JSON.stringify(e.sql || ''),
    JSON.stringify(e.values || {}),
  ].join(';'));
  return header + lines.join('\n');
}
