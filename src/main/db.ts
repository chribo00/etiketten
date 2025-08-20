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

db.exec(`
CREATE TABLE IF NOT EXISTS cart(
  id TEXT PRIMARY KEY,
  articleId INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  qty REAL DEFAULT 1,
  printOptions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

const upsertArticle = db.prepare(`INSERT INTO articles (articleNumber, ean, name, price, unit, productGroup, updated_at)
VALUES (@articleNumber, @ean, COALESCE(NULLIF(@name,''),'(ohne Bezeichnung)'), @price, @unit, @productGroup, CURRENT_TIMESTAMP)
ON CONFLICT(articleNumber) DO UPDATE SET
  ean = excluded.ean,
  name = excluded.name,
  price = excluded.price,
  unit = excluded.unit,
  productGroup = excluded.productGroup,
  updated_at = CURRENT_TIMESTAMP;`);

const upsertTier = db.prepare(`INSERT INTO price_tiers (articleNumber, qty, price)
VALUES (@articleNumber, @qty, @price)
ON CONFLICT(articleNumber, qty) DO UPDATE SET price=excluded.price;`);

export function upsertArticles(batch: any[]) {
  const tx = db.transaction((rows: any[]) => {
    for (const item of rows) {
      const mapped = {
        articleNumber: item.articleNumber || '',
        ean: item.ean || null,
        name: item.name || '',
        price: Number(item.price ?? 0),
        unit: item.unit || null,
        productGroup: item.productGroup || null,
      };
      try {
        upsertArticle.run(mapped);
        if (Array.isArray(item.tiers)) {
          for (const tier of item.tiers) {
            if (tier && typeof tier.qty === 'number' && typeof tier.price === 'number') {
              upsertTier.run({
                articleNumber: mapped.articleNumber,
                qty: tier.qty,
                price: tier.price,
              });
            }
          }
        }
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
