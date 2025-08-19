import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

const userData = app.getPath('userData');
const dbPath = path.join(userData, 'etiketten.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  articleNumber TEXT NOT NULL,
  shortText TEXT,
  ean TEXT,
  listPrice REAL,
  imagePath TEXT NULL,
  brand TEXT NULL,
  manufacturer TEXT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart (
  id TEXT PRIMARY KEY,
  articleId TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE IF NOT EXISTS article_fts USING fts5(
  articleNumber, shortText, brand, manufacturer, content='articles', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO article_fts(rowid, articleNumber, shortText, brand, manufacturer)
  VALUES (new.rowid, new.articleNumber, new.shortText, new.brand, new.manufacturer);
END;
CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
  INSERT INTO article_fts(article_fts, rowid, articleNumber, shortText, brand, manufacturer)
  VALUES('delete', old.rowid, old.articleNumber, old.shortText, old.brand, old.manufacturer);
END;
CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
  INSERT INTO article_fts(article_fts, rowid, articleNumber, shortText, brand, manufacturer)
  VALUES('delete', old.rowid, old.articleNumber, old.shortText, old.brand, old.manufacturer);
  INSERT INTO article_fts(rowid, articleNumber, shortText, brand, manufacturer)
  VALUES (new.rowid, new.articleNumber, new.shortText, new.brand, new.manufacturer);
END;
`);

export function insertArticles(articles: any[]) {
  const insert = db.prepare(`INSERT INTO articles (id, articleNumber, shortText, ean, listPrice, imagePath, brand, manufacturer, createdAt, updatedAt) VALUES (@id, @articleNumber, @shortText, @ean, @listPrice, @imagePath, @brand, @manufacturer, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(articleNumber) DO UPDATE SET shortText=excluded.shortText, ean=excluded.ean, listPrice=excluded.listPrice, imagePath=excluded.imagePath, brand=excluded.brand, manufacturer=excluded.manufacturer, updatedAt=CURRENT_TIMESTAMP`);
  const transaction = db.transaction((rows: any[]) => {
    for (const row of rows) insert.run(row);
  });
  transaction(articles);
}

export function searchArticles(q: string, limit = 50, offset = 0) {
  const stmt = db.prepare(`SELECT * FROM articles WHERE rowid IN (SELECT rowid FROM article_fts WHERE article_fts MATCH ? LIMIT ? OFFSET ?);`);
  return stmt.all(q, limit, offset);
}

export function addToCart(articleId: string, qty: number) {
  const id = `${articleId}-${Date.now()}`;
  db.prepare(`INSERT INTO cart (id, articleId, quantity) VALUES (?, ?, ?)`).run(id, articleId, qty);
  return id;
}

export function getCart() {
  return db.prepare(`SELECT * FROM cart`).all();
}

export function updateCartQty(id: string, qty: number) {
  db.prepare(`UPDATE cart SET quantity=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`).run(qty, id);
}

export function clearCart() {
  db.prepare(`DELETE FROM cart`).run();
}

export default db;
