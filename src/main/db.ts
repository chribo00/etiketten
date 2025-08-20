import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { ensureSchema } from './db.migrations';

const dataDir = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(dataDir, { recursive: true });
export const dbPath = path.join(dataDir, 'app-data.db');
console.log('DB path:', dbPath);
const db = new Database(dbPath);
ensureSchema(db);
console.log('Schema OK');

db.exec(`
CREATE TABLE IF NOT EXISTS cart(
  id TEXT PRIMARY KEY,
  articleId INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  qty REAL DEFAULT 1,
  printOptions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

const stmtInsert = db.prepare(
  `INSERT INTO articles (articleNumber, ean, name, price, unit, productGroup, updated_at)
   VALUES (@articleNumber, @ean, @name, @price, @unit, @productGroup, CURRENT_TIMESTAMP)`,
);
const stmtUpdate = db.prepare(
  `UPDATE articles SET ean=@ean, name=@name, price=@price, unit=@unit, productGroup=@productGroup, updated_at=CURRENT_TIMESTAMP
   WHERE articleNumber=@articleNumber`,
);

export function upsertArticles(batch: any[]) {
  const tx = db.transaction((rows: any[]) => {
    let inserted = 0;
    let updated = 0;
    for (const raw of rows) {
      const item = {
        articleNumber: String(raw.articleNumber || '').trim(),
        ean: raw.ean ? String(raw.ean).trim() : null,
        name: String(raw.name || '').trim() || '(ohne Bezeichnung)',
        price: Number(raw.price ?? 0),
        unit: raw.unit ?? null,
        productGroup: raw.productGroup ?? null,
      };
      try {
        stmtInsert.run(item);
        inserted++;
      } catch (e: any) {
        if (String(e.message).includes('UNIQUE')) {
          stmtUpdate.run(item);
          updated++;
        } else {
          throw e;
        }
      }
    }
    return { inserted, updated };
  });
  return tx(batch);
}

export function getDbInfo() {
  const row = db.prepare('SELECT COUNT(*) AS n FROM articles').get() as any;
  return { path: dbPath, rowCount: row.n as number };
}

export function clearArticles() {
  const res = db.prepare('DELETE FROM articles').run();
  return res.changes;
}

export function searchArticles(opts: {
  text?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'articleNumber' | 'price';
  sortDir?: 'ASC' | 'DESC';
}) {
  const text = opts.text?.trim();
  const limit = typeof opts.limit === 'number' ? opts.limit : 50;
  const offset = typeof opts.offset === 'number' ? opts.offset : 0;
  const sortBy = ['name', 'articleNumber', 'price'].includes(opts.sortBy || '') ? opts.sortBy! : 'name';
  const sortDir = opts.sortDir === 'DESC' ? 'DESC' : 'ASC';

  const where = text
    ? 'WHERE (name LIKE @q COLLATE NOCASE OR articleNumber LIKE @q COLLATE NOCASE OR ean LIKE @q COLLATE NOCASE)'
    : '';
  const params: any = { q: text ? `%${text}%` : undefined, limit, offset };

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM articles ${where}`);
  const total = (totalStmt.get(params) as any).count as number;

  const itemsStmt = db.prepare(
    `SELECT articleNumber, ean, name, price, unit, productGroup FROM articles ${where} ORDER BY ${sortBy} ${sortDir} LIMIT @limit OFFSET @offset`,
  );
  const items = itemsStmt.all(params);

  return { items, total };
}

export function getArticle(id: number) {
  return db.prepare(`SELECT * FROM articles WHERE id=?`).get(id);
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
