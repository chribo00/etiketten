import type Database from 'better-sqlite3';

export function ensureSchema(db: Database) {
  db.pragma('journal_mode = WAL');
  db.exec(`
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY,
  articleNumber TEXT UNIQUE,
  ean TEXT,
  name TEXT NOT NULL DEFAULT '',
  price REAL DEFAULT 0,
  unit TEXT,
  productGroup TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
  `);

  const cols = db.prepare(`PRAGMA table_info(articles)`).all() as any[];
  const names = cols.map((c) => c.name);
  if (!names.includes('name')) {
    db.exec(`ALTER TABLE articles ADD COLUMN name TEXT NOT NULL DEFAULT '';`);
  }
  if (!names.includes('price')) {
    db.exec(`ALTER TABLE articles ADD COLUMN price REAL DEFAULT 0;`);
  }
  if (!names.includes('unit')) {
    db.exec(`ALTER TABLE articles ADD COLUMN unit TEXT;`);
  }
  if (!names.includes('productGroup')) {
    db.exec(`ALTER TABLE articles ADD COLUMN productGroup TEXT;`);
  }
  if (!names.includes('created_at')) {
    db.exec(`ALTER TABLE articles ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
  }
  if (!names.includes('updated_at')) {
    db.exec(`ALTER TABLE articles ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
  }

  db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_articlenumber ON articles(articleNumber);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_name ON articles(name);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_ean ON articles(ean);`);

  db.exec(`
CREATE TABLE IF NOT EXISTS price_tiers (
  articleNumber TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price REAL NOT NULL,
  PRIMARY KEY(articleNumber, qty),
  FOREIGN KEY(articleNumber) REFERENCES articles(articleNumber) ON DELETE CASCADE
);
  `);
}
