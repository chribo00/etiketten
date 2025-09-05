import Database from "better-sqlite3";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { ensureSchema } from "./db.migrations";
import { parseSearch } from './search';

const dataDir = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(dataDir, { recursive: true });
export const dbPath = path.join(dataDir, 'app-data.db');
console.log('DB path:', dbPath);
export const db = new Database(dbPath);
ensureSchema(db);
const ti = db.prepare("PRAGMA table_info(articles)").all();
console.log('[db] table_info(articles) =>', ti.map(({ name, notnull, type }) => ({ name, notnull, type })));
const il = db.prepare("PRAGMA index_list('articles')").all();
console.log("[db] index_list('articles') =>", il);
console.log('Schema OK');

export const mediaRoot = path.join(app.getPath('userData'), 'media');
fs.mkdirSync(mediaRoot, { recursive: true });

db.exec(`
CREATE TABLE IF NOT EXISTS cart(
  id TEXT PRIMARY KEY,
  articleId INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  qty REAL DEFAULT 1,
  printOptions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

export type ArticleRow = {
  articleNumber: string;
  ean: string | null;
  name: string | null;
  price: number | null;
  unit: string | null;
  productGroup: string | null;
  category_id: number | null;
};

export type ImportRow = {
  articleNumber?: string | null;
  ean?: string | null;
  name?: string | null;
  price?: number | string | null;
  unit?: string | null;
  productGroup?: string | null;
  category_id?: number | string | null;
};

function normalizeRow(input: ImportRow): ImportRow {
  const trimOrNull = (v: any) =>
    v === undefined || v === null ? null : String(v).trim() === '' ? null : String(v).trim();

  const out: ImportRow = {};

  out.articleNumber = trimOrNull(input.articleNumber);
  out.ean           = trimOrNull(input.ean);
  out.name          = input.name === undefined || input.name === null
    ? ''
    : String(input.name).trim();

  if (input.price === undefined || input.price === null || String(input.price).trim() === '') {
    out.price = null;
  } else {
    const num = Number(String(input.price).replace(',', '.'));
    out.price = Number.isFinite(num) ? num : null;
  }

  out.unit         = trimOrNull(input.unit);
  out.productGroup = trimOrNull(input.productGroup);

  if (input.category_id === undefined || input.category_id === null || String(input.category_id).trim() === '') {
    out.category_id = null;
  } else {
    const idNum = Number(String(input.category_id).trim());
    out.category_id = Number.isFinite(idNum) ? idNum : null;
  }

  return out;
}

// Hilfsfunktion: baut ein "sicheres" UPSERT, auch wenn updateCols leer ist
function buildUpsertSQL(columnsPresent: string[], updateCols: string[]) {
  const insertCols = [...columnsPresent, 'updated_at'];
  const insertVals = insertCols.map(c => c === 'updated_at' ? 'CURRENT_TIMESTAMP' : `@${c}`);

  const updateList = (updateCols.length > 0
    ? [...updateCols.map(c => `${c} = excluded.${c}`), 'updated_at = excluded.updated_at']
    : ['updated_at = excluded.updated_at']
  ).join(',');

  const sql = `
    INSERT INTO articles (${insertCols.join(',')})
    VALUES (${insertVals.join(',')})
    ON CONFLICT(articleNumber) DO UPDATE SET ${updateList}
  `.trim();

  return sql;
}

function toPlainParams(obj: Record<string, any>) {
  const plain: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    plain[k] = v === undefined ? null : v;
  }
  return plain;
}

export function upsertArticles(rows: ImportRow[]) {
  const normalized = rows.map(normalizeRow).map((r, idx) => ({ ...r, row: (rows as any)[idx]?.row ?? idx }));

  const results = {
    ok: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{
      row: number;
      code?: number;
      message: string;
      sql: string;
      params: Record<string, any>;
    }>,
  };

  const tx = db.transaction((items: any[]) => {
    for (let i = 0; i < items.length; i++) {
      const r = items[i];

      if (!r.articleNumber) {
        results.errors.push({
          row: r.row ?? i,
          message: 'articleNumber fehlt oder ist leer',
          sql: '',
          params: toPlainParams(r),
        });
        continue;
      }

      const columnsPresent = Object.keys(r).filter(k => r[k] !== undefined && k !== 'row');
      const updateCols = columnsPresent.filter(c => c !== 'articleNumber');

      const sql = buildUpsertSQL(columnsPresent, updateCols);
      const stmt = db.prepare(sql);

      try {
        const params = toPlainParams({ ...r });
        const info = stmt.run(params);
        if (info.changes === 1 && info.lastInsertRowid !== 0n && info.lastInsertRowid !== 0) {
          results.inserted++;
        } else if (info.changes >= 1) {
          results.updated++;
        } else {
          results.skipped++;
        }
      } catch (err: any) {
        const code = typeof err.code === 'number' ? err.code : undefined;
        results.errors.push({
          row: r.row ?? i,
          code,
          message: String(err.message || err),
          sql,
          params: toPlainParams(r),
        });
      }
    }
  });

  tx(normalized);

  results.ok = normalized.length - results.errors.length;
  return results;
}

export function getDbInfo() {
  const row = db.prepare('SELECT COUNT(*) AS n FROM articles').get() as any;
  return { path: dbPath, rowCount: row.n as number };
}

export function clearArticles() {
  const res = db.prepare('DELETE FROM articles').run();
  return res.changes;
}

const CAT_NAME_RE = /^[A-Za-z0-9ÄÖÜäöüß _\-\.\/&]+$/;

function validateCategoryName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50) return false;
  if (!CAT_NAME_RE.test(trimmed)) return false;
  return true;
}

function tableHasColumn(table: string, column: string): boolean {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    return cols.some((c) => c.name === column);
  } catch {
    return false;
  }
}

export function listCategories() {
  return db.prepare('SELECT id, name FROM categories ORDER BY name COLLATE NOCASE ASC').all();
}

export function createCategory(name: string) {
  const trimmed = name.trim();
  if (!validateCategoryName(trimmed)) return { error: 'VALIDATION_ERROR' };
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  try {
    const res = stmt.run(trimmed);
    return { id: Number(res.lastInsertRowid) };
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) return { error: 'DUPLICATE_NAME' };
    throw e;
  }
}

export function renameCategory(id: number, newName: string) {
  const trimmed = newName.trim();
  if (!validateCategoryName(trimmed)) return { error: 'VALIDATION_ERROR' };
  const tx = db.transaction((cid: number, name: string) => {
    const res = db
      .prepare('UPDATE categories SET name=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(name, cid);
    if (res.changes === 0) return { error: 'NOT_FOUND' };
    return { changes: res.changes };
  });
  try {
    return tx(id, trimmed);
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) return { error: 'DUPLICATE_NAME' };
    throw e;
  }
}

export function deleteCategory(
  id: number,
  mode: 'reassign' | 'deleteArticles',
  reassignToId?: number | null,
) {
  const cat = db.prepare('SELECT id FROM categories WHERE id=?').get(id);
  if (!cat) return { error: 'NOT_FOUND' };

  const hasArticlesTable = tableHasColumn('articles', 'category_id');
  const hasCustomTable = tableHasColumn('custom_articles', 'category_id');
  const countArticles = hasArticlesTable
    ? (db.prepare('SELECT COUNT(*) as c FROM articles WHERE category_id=?').get(id) as any).c
    : 0;
  const countCustom = hasCustomTable
    ? (db.prepare('SELECT COUNT(*) as c FROM custom_articles WHERE category_id=?').get(id) as any).c
    : 0;
  const total = countArticles + countCustom;

  if (mode === 'reassign') {
    if (total > 0 && reassignToId === undefined) return { error: 'HAS_ARTICLES' };
    if (reassignToId != null) {
      const target = db.prepare('SELECT id FROM categories WHERE id=?').get(reassignToId);
      if (!target) return { error: 'NOT_FOUND' };
    }
    const tx = db.transaction(() => {
      if (hasArticlesTable) {
        db.prepare('UPDATE articles SET category_id=? WHERE category_id=?').run(reassignToId ?? null, id);
      }
      if (hasCustomTable) {
        db.prepare('UPDATE custom_articles SET category_id=? WHERE category_id=?').run(reassignToId ?? null, id);
      }
      db.prepare('DELETE FROM categories WHERE id=?').run(id);
    });
    tx();
    return { deleted: true };
  }
  if (mode === 'deleteArticles') {
    const tx = db.transaction(() => {
      if (hasArticlesTable) {
        db.prepare('DELETE FROM articles WHERE category_id=?').run(id);
      }
      if (hasCustomTable) {
        db.prepare('DELETE FROM custom_articles WHERE category_id=?').run(id);
      }
      db.prepare('DELETE FROM categories WHERE id=?').run(id);
    });
    tx();
    return { deleted: true };
  }
  return { error: 'VALIDATION_ERROR' };
}

function categoryCond(alias: string, id?: number) {
  if (id === undefined) return '1=1';
  if (id === 0) return `${alias}.category_id IS NULL`;
  return `${alias}.category_id = @category`;
}

function likeEscape(s: string) {
  return s.replace(/[%_]/g, (c) => `\\${c}`);
}

export function searchArticles(opts: {
  text?: string;
  limit?: number;
  offset?: number;
  categoryId?: number;
}) {
  const text = opts.text?.trim();
  const limit = typeof opts.limit === 'number' ? opts.limit : 50;
  const offset = typeof opts.offset === 'number' ? opts.offset : 0;
  const catCond = categoryCond('a', opts.categoryId);

  if (!text) {
    const where = catCond !== '1=1' ? `WHERE ${catCond}` : '';
    const params: any = { limit, offset, category: opts.categoryId };
    const total = (db.prepare(`SELECT COUNT(*) as c FROM articles ${where}`).get(params) as any).c as number;
    const items = db
      .prepare(
        `SELECT articleNumber, ean, name, price, unit, productGroup, category_id FROM articles ${where} ORDER BY name COLLATE NOCASE ASC, articleNumber COLLATE NOCASE ASC LIMIT @limit OFFSET @offset`,
      )
      .all(params);
    return { items, total };
  }

  const parsed = parseSearch(text);
  if (!parsed.match) return { items: [], total: 0 };

  const params: any = { match: parsed.match, limit, offset, category: opts.categoryId };
  const base = `WITH q AS (
    SELECT rowid, -bm25(articles_fts) AS rank FROM articles_fts WHERE rowid>0 AND articles_fts MATCH @match
  )`;
  const countSql = `${base} SELECT COUNT(*) as c FROM q JOIN articles a ON a.id=q.rowid WHERE ${catCond}`;
  let total = (db.prepare(countSql).get(params) as any).c as number;
  let items: any[] = [];
  if (total > 0) {
    const itemsSql = `${base}
      SELECT a.id, a.articleNumber, a.ean, a.name, a.price, a.unit, a.productGroup, a.category_id, q.rank
      FROM q JOIN articles a ON a.id=q.rowid
      WHERE ${catCond}
      ORDER BY q.rank DESC, a.name COLLATE NOCASE ASC, a.articleNumber COLLATE NOCASE ASC
      LIMIT @limit OFFSET @offset`;
    items = db.prepare(itemsSql).all(params);
  } else if (parsed.terms.length) {
    const likeParams: any = { limit, offset, category: opts.categoryId };
    const conds: string[] = [];
    parsed.terms.forEach((t, i) => {
      const k = `p${i}`;
      likeParams[k] = `%${likeEscape(t)}%`;
      conds.push(`(a.name LIKE @${k} ESCAPE '\\' COLLATE NOCASE OR a.articleNumber LIKE @${k} COLLATE NOCASE OR a.ean LIKE @${k} COLLATE NOCASE)`);
    });
    const where = conds.length ? conds.join(' AND ') : '1';
    const countLike = `SELECT COUNT(*) as c FROM articles a WHERE ${where} AND ${catCond}`;
    total = (db.prepare(countLike).get(likeParams) as any).c as number;
    if (total > 0) {
      const itemsLike = `SELECT id, articleNumber, ean, name, price, unit, productGroup, category_id FROM articles a WHERE ${where} AND ${catCond} ORDER BY a.name COLLATE NOCASE ASC, a.articleNumber COLLATE NOCASE ASC LIMIT @limit OFFSET @offset`;
      items = db.prepare(itemsLike).all(likeParams);
    }
  }
  return { items, total };
}

export function searchAllArticles(opts: {
  text?: string;
  limit?: number;
  offset?: number;
  categoryId?: number;
}) {
  const text = opts.text?.trim();
  const limit = typeof opts.limit === 'number' ? opts.limit : 50;
  const offset = typeof opts.offset === 'number' ? opts.offset : 0;
  const condA = categoryCond('a', opts.categoryId);
  const condC = categoryCond('c', opts.categoryId);

  if (!text) {
    const whereA = condA !== '1=1' ? `WHERE ${condA}` : '';
    const whereC = condC !== '1=1' ? `WHERE ${condC}` : '';
    const params: any = { limit, offset, category: opts.categoryId };
    const total = (db
      .prepare(
        `SELECT COUNT(*) as c FROM (SELECT a.id FROM articles a ${whereA} UNION ALL SELECT c.id FROM custom_articles c ${whereC})`,
      )
      .get(params) as any).c as number;
    const items = db
      .prepare(
        `SELECT a.id AS id, a.articleNumber AS articleNumber, a.ean AS ean, a.name AS name, a.price AS price, a.unit AS unit, a.productGroup AS productGroup, a.category_id AS category_id, 'import' AS source, am.path AS imagePath FROM articles a LEFT JOIN article_media am ON am.article_id=a.id AND am.is_primary=1 ${whereA}
         UNION ALL
         SELECT c.id AS id, c.articleNumber AS articleNumber, c.ean AS ean, c.name AS name, c.price AS price, c.unit AS unit, c.productGroup AS productGroup, c.category_id AS category_id, 'custom' AS source, NULL AS imagePath FROM custom_articles c ${whereC}
         ORDER BY name COLLATE NOCASE ASC, articleNumber COLLATE NOCASE ASC LIMIT @limit OFFSET @offset`,
      )
      .all(params);
    return { items, total };
  }

  const parsed = parseSearch(text);
  if (!parsed.match) return { items: [], total: 0 };

  const params: any = { match: parsed.match, limit, offset, category: opts.categoryId };
  const base = `WITH q AS (
    SELECT rowid, -bm25(articles_fts) AS rank FROM articles_fts WHERE articles_fts MATCH @match
  )`;
  const countSql = `${base} SELECT COUNT(*) as c FROM (
      SELECT 1 FROM q JOIN articles a ON a.id=q.rowid WHERE q.rowid>0 AND ${condA}
      UNION ALL
      SELECT 1 FROM q JOIN custom_articles c ON c.id=-q.rowid WHERE q.rowid<0 AND ${condC}
    )`;
  let total = (db.prepare(countSql).get(params) as any).c as number;
  let items: any[] = [];
  if (total > 0) {
    const itemsSql = `${base}
      SELECT a.id AS id, a.articleNumber AS articleNumber, a.ean AS ean, a.name AS name, a.price AS price, a.unit AS unit, a.productGroup AS productGroup, a.category_id AS category_id, 'import' AS source, q.rank, am.path AS imagePath
      FROM q JOIN articles a ON a.id=q.rowid
      LEFT JOIN article_media am ON am.article_id=a.id AND am.is_primary=1
      WHERE q.rowid>0 AND ${condA}
      UNION ALL
      SELECT c.id AS id, c.articleNumber AS articleNumber, c.ean AS ean, c.name AS name, c.price AS price, c.unit AS unit, c.productGroup AS productGroup, c.category_id AS category_id, 'custom' AS source, q.rank, NULL AS imagePath
      FROM q JOIN custom_articles c ON c.id=-q.rowid
      WHERE q.rowid<0 AND ${condC}
      ORDER BY q.rank DESC, name COLLATE NOCASE ASC, articleNumber COLLATE NOCASE ASC
      LIMIT @limit OFFSET @offset`;
    items = db.prepare(itemsSql).all(params);
  } else if (parsed.terms.length) {
    const likeParams: any = { limit, offset, category: opts.categoryId };
    const condsA: string[] = [];
    const condsC: string[] = [];
    parsed.terms.forEach((t, i) => {
      const k = `p${i}`;
      likeParams[k] = `%${likeEscape(t)}%`;
      condsA.push(
        `(a.name LIKE @${k} ESCAPE '\\' COLLATE NOCASE OR a.articleNumber LIKE @${k} COLLATE NOCASE OR a.ean LIKE @${k} COLLATE NOCASE OR cat.name LIKE @${k} COLLATE NOCASE)`,
      );
      condsC.push(
        `(c.name LIKE @${k} ESCAPE '\\' COLLATE NOCASE OR c.articleNumber LIKE @${k} COLLATE NOCASE OR c.ean LIKE @${k} COLLATE NOCASE OR cat.name LIKE @${k} COLLATE NOCASE)`,
      );
    });
    const whereA = condsA.length ? condsA.join(' AND ') : '1';
    const whereC = condsC.length ? condsC.join(' AND ') : '1';
    const countLike = `SELECT COUNT(*) as c FROM (
        SELECT 1 FROM articles a LEFT JOIN categories cat ON cat.id=a.category_id WHERE ${whereA} AND ${condA}
        UNION ALL
        SELECT 1 FROM custom_articles c LEFT JOIN categories cat ON cat.id=c.category_id WHERE ${whereC} AND ${condC}
      )`;
    total = (db.prepare(countLike).get(likeParams) as any).c as number;
    if (total > 0) {
      const itemsLike = `
        SELECT a.id AS id, a.articleNumber AS articleNumber, a.ean AS ean, a.name AS name, a.price AS price, a.unit AS unit, a.productGroup AS productGroup, a.category_id AS category_id, 'import' AS source, 0 AS rank, am.path AS imagePath
        FROM articles a LEFT JOIN categories cat ON cat.id = a.category_id LEFT JOIN article_media am ON am.article_id=a.id AND am.is_primary=1
        WHERE ${whereA} AND ${condA}
        UNION ALL
        SELECT c.id AS id, c.articleNumber AS articleNumber, c.ean AS ean, c.name AS name, c.price AS price, c.unit AS unit, c.productGroup AS productGroup, c.category_id AS category_id, 'custom' AS source, 0 AS rank, NULL AS imagePath
        FROM custom_articles c LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE ${whereC} AND ${condC}
        ORDER BY name COLLATE NOCASE ASC, articleNumber COLLATE NOCASE ASC
        LIMIT @limit OFFSET @offset`;
      items = db.prepare(itemsLike).all(likeParams);
    }
  }
  return { items, total };
}

export function createCustomArticle(a: {
  articleNumber?: string;
  name: string;
  ean?: string;
  price?: number;
  unit?: string;
  productGroup?: string;
  categoryId?: number;
}) {
  const stmt = db.prepare(
    `INSERT INTO custom_articles (articleNumber, ean, name, price, unit, productGroup, category_id, updated_at)
     VALUES (@articleNumber, @ean, @name, @price, @unit, @productGroup, @categoryId, CURRENT_TIMESTAMP)`,
  );
  const res = stmt.run({
    articleNumber: a.articleNumber ?? null,
    ean: a.ean ?? null,
    name: a.name,
    price: a.price ?? 0,
    unit: a.unit ?? null,
    productGroup: a.productGroup ?? null,
    categoryId: a.categoryId ?? null,
  });
  return { id: Number(res.lastInsertRowid) };
}

export function updateCustomArticle(
  id: number,
  patch: {
    articleNumber?: string;
    ean?: string;
    name?: string;
    price?: number;
    unit?: string;
    productGroup?: string;
    categoryId?: number;
  },
) {
  const fields: string[] = [];
  const params: any = { id };
  for (const key of ['articleNumber', 'ean', 'name', 'price', 'unit', 'productGroup', 'categoryId'] as const) {
    if (patch[key] !== undefined) {
      const col = key === 'categoryId' ? 'category_id' : key;
      fields.push(`${col}=@${key}`);
      params[key] = patch[key];
    }
  }
  if (fields.length === 0) return { changes: 0 };
  const stmt = db.prepare(
    `UPDATE custom_articles SET ${fields.join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE id=@id`,
  );
  const res = stmt.run(params);
  return { changes: res.changes };
}

export function deleteCustomArticle(id: number) {
  const res = db.prepare(`DELETE FROM custom_articles WHERE id=?`).run(id);
  return { changes: res.changes };
}

export function addPrimaryMedia(params: {
  articleId: number;
  filePath: string;
  alt?: string;
}) {
  if (!fs.existsSync(params.filePath)) return { error: 'FILE_NOT_FOUND' };
  const ext = path.extname(params.filePath);
  const fileName = `${params.articleId}_${Date.now()}${ext}`;
  const destPath = path.join(mediaRoot, fileName);
  fs.copyFileSync(params.filePath, destPath);
  const tx = db.transaction(() => {
    db.prepare('UPDATE article_media SET is_primary=0 WHERE article_id=?').run(params.articleId);
    const res = db
      .prepare('INSERT INTO article_media (article_id, path, alt, is_primary) VALUES (?,?,?,1)')
      .run(params.articleId, fileName, params.alt ?? null);
    return { id: Number(res.lastInsertRowid), path: fileName, alt: params.alt ?? null };
  });
  return tx();
}

export function listMedia(articleId: number) {
  return db
    .prepare(
      'SELECT id, article_id, path, alt, is_primary, created_at FROM article_media WHERE article_id=? ORDER BY created_at DESC',
    )
    .all(articleId);
}

export function removeMedia(mediaId: number) {
  const row = db.prepare('SELECT path FROM article_media WHERE id=?').get(mediaId) as any;
  if (!row) return { error: 'NOT_FOUND' };
  db.prepare('DELETE FROM article_media WHERE id=?').run(mediaId);
  if (row.path && !row.path.startsWith('url:')) {
    const abs = path.join(mediaRoot, row.path);
    if (fs.existsSync(abs)) {
      try {
        fs.unlinkSync(abs);
      } catch {}
    }
  }
  return { success: true };
}

export function getArticle(id: number) {
  return db
    .prepare(
      `SELECT a.*, m.path AS imagePath FROM articles a LEFT JOIN article_media m ON m.article_id=a.id AND m.is_primary=1 WHERE a.id=?`,
    )
    .get(id);
}

export function addToCart(articleId: number, qty = 1, opts: any = {}) {
  const id = `${articleId}-${Date.now()}`;
  db.prepare(`INSERT INTO cart (id, articleId, qty, printOptions) VALUES (?, ?, ?, ?)`).run(id, articleId, qty, JSON.stringify(opts));
  return id;
}

export function getCart() {
  return db
    .prepare(`SELECT * FROM cart`)
    .all()
    .map((row: any) => ({ ...row, printOptions: row.printOptions ? JSON.parse(row.printOptions) : {} }));
}

export function updateCartItem(id: string, patch: any) {
  const item = getCart().find((c: any) => c.id === id);
  if (!item) return;
  const qty = patch.qty ?? item.qty;
  const opts = patch.opts ? JSON.stringify(patch.opts) : JSON.stringify(item.printOptions);
  db.prepare(`UPDATE cart SET qty=?, printOptions=? WHERE id=?`).run(qty, opts, id);
}

export function removeCartItem(id: string) {
  db.prepare(`DELETE FROM cart WHERE id=?`).run(id);
}

export function clearCart() {
  db.prepare(`DELETE FROM cart`).run();
}

export default db;
