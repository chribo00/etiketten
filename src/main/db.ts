import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'app-data.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS articles(
  id TEXT PRIMARY KEY,
  articleNumber TEXT,
  name TEXT,
  shortText TEXT,
  longText TEXT,
  ean TEXT,
  listPrice REAL,
  imagePath TEXT,
  brand TEXT,
  groupCode TEXT,
  uom TEXT DEFAULT 'Stk',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  articleNumber, name, shortText, longText, content='articles', content_rowid='rowid'
);
CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, articleNumber, name, shortText, longText)
  VALUES (new.rowid, new.articleNumber, new.name, new.shortText, new.longText);
END;
CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
  UPDATE articles_fts SET articleNumber=new.articleNumber, name=new.name,
    shortText=new.shortText, longText=new.longText WHERE rowid=new.rowid;
END;
CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
  DELETE FROM articles_fts WHERE rowid=old.rowid;
END;
CREATE TABLE IF NOT EXISTS cart(
  id TEXT PRIMARY KEY,
  articleId TEXT REFERENCES articles(id) ON DELETE CASCADE,
  qty REAL DEFAULT 1,
  printOptions TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const upsertArticle = db.prepare(
  `INSERT INTO articles (id, articleNumber, name, shortText, longText, ean, listPrice, imagePath, brand, groupCode, uom, createdAt, updatedAt)
VALUES (
  @id,
  @articleNumber,
  COALESCE(NULLIF(@name, ''), '(ohne Bezeichnung)'),
  @shortText,
  @longText,
  @ean,
  @listPrice,
  @imagePath,
  @brand,
  @groupCode,
  @uom,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET
  articleNumber=excluded.articleNumber,
  name=COALESCE(NULLIF(excluded.name, ''), '(ohne Bezeichnung)'),
  shortText=excluded.shortText,
  longText=excluded.longText,
  ean=excluded.ean,
  listPrice=excluded.listPrice,
  imagePath=excluded.imagePath,
  brand=excluded.brand,
  groupCode=excluded.groupCode,
  uom=excluded.uom,
  updatedAt=CURRENT_TIMESTAMP;`
);

export function upsertArticles(batch: any[]) {
  const tx = db.transaction((rows: any[]) => {
    for (const item of rows) {
      const mapped = {
        id: item.id,
        articleNumber: item.articleNumber || item.artikelnummer || item.id || '',
        name: (item.name || item.shortText || item.kurztext || item.title || item.description || '')
          .toString()
          .trim(),
        shortText: item.shortText ?? item.kurztext ?? '',
        longText: item.longText ?? item.description ?? '',
        ean: item.ean || null,
        listPrice: Number(item.price ?? item.listPrice ?? 0),
        imagePath: item.imagePath || item.image || null,
        brand: item.brand || null,
        groupCode: item.groupCode || null,
        uom: item.uom || 'Stk',
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

export function searchArticles(q: string, limit = 50, offset = 0) {
  const stmt = db.prepare(`SELECT * FROM articles WHERE rowid IN (SELECT rowid FROM articles_fts WHERE articles_fts MATCH ? LIMIT ? OFFSET ?);`);
  return stmt.all(q, limit, offset);
}

export function getArticle(id: string) {
  return db.prepare(`SELECT * FROM articles WHERE id=?`).get(id);
}

export function addToCart(articleId: string, qty = 1, opts: any = {}) {
  const id = `${articleId}-${Date.now()}`;
  db.prepare(`INSERT INTO cart (id, articleId, qty, printOptions) VALUES (?, ?, ?, ?)`).run(id, articleId, qty, JSON.stringify(opts));
  return id;
}

export function getCart() {
  return db.prepare(`SELECT * FROM cart`).all().map((row: any) => ({ ...row, printOptions: row.printOptions ? JSON.parse(row.printOptions) : {} }));
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
