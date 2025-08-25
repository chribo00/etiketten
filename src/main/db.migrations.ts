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
  const artCol = cols.find((c) => c.name === 'articleNumber');
  if (artCol && String(artCol.type).toUpperCase() !== 'TEXT') {
    db.exec(`ALTER TABLE articles RENAME TO _articles_old;`);
    db.exec(`
      CREATE TABLE articles (
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
    db.exec(`
      INSERT INTO articles (id, articleNumber, ean, name, price, unit, productGroup, created_at, updated_at)
      SELECT id, CAST(articleNumber AS TEXT), ean, name, price, unit, productGroup, created_at, updated_at FROM _articles_old;
    `);
    db.exec(`DROP TABLE _articles_old;`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_articlenumber ON articles(articleNumber);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_name ON articles(name);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_ean ON articles(ean);`);
  }
  if (!names.includes('ean')) {
    db.exec(`ALTER TABLE articles ADD COLUMN ean TEXT;`);
  }
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
CREATE TABLE IF NOT EXISTS custom_articles (
  id INTEGER PRIMARY KEY,
  articleNumber TEXT,
  ean TEXT,
  name TEXT NOT NULL DEFAULT '',
  price REAL DEFAULT 0,
  unit TEXT,
  productGroup TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
  `);

  const cCols = db.prepare(`PRAGMA table_info(custom_articles)`).all() as any[];
  const cNames = cCols.map((c) => c.name);
  if (!cNames.includes('articleNumber')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN articleNumber TEXT;`);
  }
  if (!cNames.includes('ean')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN ean TEXT;`);
  }
  if (!cNames.includes('name')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN name TEXT NOT NULL DEFAULT '';`);
  }
  if (!cNames.includes('price')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN price REAL DEFAULT 0;`);
  }
  if (!cNames.includes('unit')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN unit TEXT;`);
  }
  if (!cNames.includes('productGroup')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN productGroup TEXT;`);
  }
  if (!cNames.includes('created_at')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
  }
  if (!cNames.includes('updated_at')) {
    db.exec(`ALTER TABLE custom_articles ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
  }

  db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_name ON custom_articles(name);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_artnr ON custom_articles(articleNumber);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_ean ON custom_articles(ean);`);

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
