import type { Database as DatabaseType } from 'better-sqlite3';

export function ensureSchema(db: DatabaseType) {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const currentVersion = db.pragma('user_version', { simple: true }) as number;
  if (currentVersion >= 1) return;

  const migrate = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY,
        articleNumber TEXT NOT NULL UNIQUE,
        ean TEXT,
        name TEXT NOT NULL DEFAULT '',
        price REAL DEFAULT 0,
        unit TEXT,
        productGroup TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
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
          articleNumber TEXT NOT NULL UNIQUE,
          ean TEXT,
          name TEXT NOT NULL DEFAULT '',
          price REAL DEFAULT 0,
          unit TEXT,
          productGroup TEXT,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      db.exec(`
        INSERT INTO articles (id, articleNumber, ean, name, price, unit, productGroup, category_id, created_at, updated_at)
        SELECT id, CAST(articleNumber AS TEXT), ean, name, price, unit, productGroup, category_id, created_at, updated_at FROM _articles_old;
      `);
      db.exec(`DROP TABLE _articles_old;`);
    }

    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_articlenumber ON articles(articleNumber);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_name ON articles(name);`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_ean ON articles(ean);`);

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
    if (!names.includes('category_id')) {
      db.exec(
        `ALTER TABLE articles ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;`,
      );
    }
    if (!names.includes('created_at')) {
      db.exec(`ALTER TABLE articles ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
    }
    if (!names.includes('updated_at')) {
      db.exec(`ALTER TABLE articles ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
    }

    db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS custom_articles (
        id INTEGER PRIMARY KEY,
        articleNumber TEXT,
        ean TEXT,
        name TEXT NOT NULL DEFAULT '',
        price REAL DEFAULT 0,
        unit TEXT,
        productGroup TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
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
    if (!cNames.includes('category_id')) {
      db.exec(
        `ALTER TABLE custom_articles ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;`,
      );
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
    db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_articles_category_id ON custom_articles(category_id);`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS price_tiers (
        articleNumber TEXT NOT NULL,
        qty INTEGER NOT NULL,
        price REAL NOT NULL,
        PRIMARY KEY(articleNumber, qty),
        FOREIGN KEY(articleNumber) REFERENCES articles(articleNumber) ON DELETE CASCADE
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      );
    `);

    const catCols = db.prepare(`PRAGMA table_info(categories)`).all() as any[];
    const catNames = catCols.map((c) => c.name);
    if (!catNames.includes('updated_at')) {
      db.exec(`ALTER TABLE categories ADD COLUMN updated_at DATETIME;`);
    }
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name ON categories(LOWER(name));`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS article_media (
        id INTEGER PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        alt TEXT,
        is_primary INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_article_media_article_primary ON article_media(article_id, is_primary);`,
    );

    try {
      db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
        articleNumber, name, kurztext2, langtext, matchcode, ean, supplierName, category_name,
        tokenize='unicode61 remove_diacritics 2 tokenchars ''-_.'''
      );`);
    } catch (err) {
      if (String(err).toLowerCase().includes('tokenize')) {
        db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
          articleNumber, name, kurztext2, langtext, matchcode, ean, supplierName, category_name,
          tokenize='unicode61 tokenchars ''-_.'''
        );`);
      } else {
        throw err;
      }
    }

    db.exec(`CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
      INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        VALUES (new.id, new.articleNumber, new.name, new.ean,
          (SELECT name FROM categories WHERE id=new.category_id));
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid) VALUES('delete', old.id);
      INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        VALUES (new.id, new.articleNumber, new.name, new.ean,
          (SELECT name FROM categories WHERE id=new.category_id));
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid) VALUES('delete', old.id);
    END;`);

    db.exec(`CREATE TRIGGER IF NOT EXISTS custom_articles_ai AFTER INSERT ON custom_articles BEGIN
      INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        VALUES (-new.id, new.articleNumber, new.name, new.ean,
          (SELECT name FROM categories WHERE id=new.category_id));
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS custom_articles_au AFTER UPDATE ON custom_articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid) VALUES('delete', -old.id);
      INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        VALUES (-new.id, new.articleNumber, new.name, new.ean,
          (SELECT name FROM categories WHERE id=new.category_id));
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS custom_articles_ad AFTER DELETE ON custom_articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid) VALUES('delete', -old.id);
    END;`);

    db.exec(`CREATE TRIGGER IF NOT EXISTS categories_au AFTER UPDATE ON categories BEGIN
      UPDATE articles_fts SET category_name=new.name
        WHERE rowid IN (SELECT id FROM articles WHERE category_id=new.id);
      UPDATE articles_fts SET category_name=new.name
        WHERE rowid IN (SELECT -id FROM custom_articles WHERE category_id=new.id);
    END;`);

    const ftsCount = (db.prepare('SELECT count(*) as c FROM articles_fts').get() as any).c as number;
    if (ftsCount === 0) {
      db.exec(`INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        SELECT a.id, a.articleNumber, a.name, a.ean, c.name
        FROM articles a LEFT JOIN categories c ON c.id=a.category_id;`);
      db.exec(`INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        SELECT -c.id, c.articleNumber, c.name, c.ean, cat.name
        FROM custom_articles c LEFT JOIN categories cat ON cat.id=c.category_id;`);
      try {
        db.exec(`INSERT INTO articles_fts(articles_fts) VALUES('optimize');`);
      } catch {}
    }

    db.pragma('user_version = 1');
  });

  migrate();
}
