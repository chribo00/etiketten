import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { ensureSchema } from './db.migrations';

const dataDir = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'app-data.db');
console.log('DB path:', dbPath);
const db = new Database(dbPath);
ensureSchema(db);
console.log('Schema OK');

// ensure index on article name for faster searches
db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_name ON articles(name);`);

db.exec(`
CREATE TABLE IF NOT EXISTS cart(
  id TEXT PRIMARY KEY,
  articleId INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  qty REAL DEFAULT 1,
  printOptions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

const upsertArticle = db.prepare(
  `INSERT INTO articles (articleNumber, ean, name, price, image, created_at, updated_at)
VALUES (
  @articleNumber,
  @ean,
  COALESCE(NULLIF(@name, ''), '(ohne Bezeichnung)'),
  @price,
  @image,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(articleNumber) DO UPDATE SET
  ean=excluded.ean,
  name=COALESCE(NULLIF(excluded.name, ''), '(ohne Bezeichnung)'),
  price=excluded.price,
  image=excluded.image,
  updated_at=CURRENT_TIMESTAMP;`
);

export function upsertArticles(batch: any[]) {
  const tx = db.transaction((rows: any[]) => {
    for (const item of rows) {
      const mapped = {
        articleNumber: item.articleNumber || item.artikelnummer || item.id || '',
        ean: item.ean || null,
        name: item.name || item.shortText || item.kurztext || '',
        price: Number(item.price ?? item.listPrice ?? 0),
        image: item.image || null,
      };
      try {
        upsertArticle.run(mapped);
      } catch (err) {
        (err as any).item = mapped;
        throw err;
      }
    }
  });
  tx(batch);
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
  const sortBy = ['name', 'articleNumber', 'price'].includes(opts.sortBy || '')
    ? opts.sortBy!
    : 'name';
  const sortDir = opts.sortDir === 'DESC' ? 'DESC' : 'ASC';

  const where = text
    ? 'WHERE (name LIKE ? COLLATE NOCASE OR articleNumber LIKE ? COLLATE NOCASE OR ean LIKE ? COLLATE NOCASE)'
    : '';
  const params = text ? [`%${text}%`, `%${text}%`, `%${text}%`] : [];

  const totalStmt = db.prepare(
    `SELECT COUNT(*) as count FROM articles ${where}`,
  );
  const total = (totalStmt.get(...params) as any).count as number;

  const itemsStmt = db.prepare(
    `SELECT id, articleNumber, ean, name, price FROM articles ${where} ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`,
  );
  const items = itemsStmt.all(...params, limit, offset);

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
