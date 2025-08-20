import type Database from 'better-sqlite3';

export function ensureSchema(db: Database) {
  db.pragma('journal_mode = WAL');
  const v = db.pragma('user_version', { simple: true }) as number;
  const migrate = db.transaction(() => {
    if (v < 1) {
      db.exec(`
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY,
  articleNumber TEXT UNIQUE,
  ean TEXT,
  name TEXT NOT NULL DEFAULT '',
  price REAL,
  image BLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_articles_articlenumber ON articles(articleNumber);
CREATE INDEX IF NOT EXISTS idx_articles_ean ON articles(ean);
`);
      db.pragma('user_version = 1');
    }

    const cols = db.prepare(`PRAGMA table_info(articles)`).all() as any[];
    const hasName = cols.some((c) => c.name === 'name');
    if (!hasName) {
      db.exec(`ALTER TABLE articles ADD COLUMN name TEXT NOT NULL DEFAULT '';`);
      if (v < 2) {
        db.pragma('user_version = 2');
      }
    }
  });
  migrate();
}
