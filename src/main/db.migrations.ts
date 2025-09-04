// src/main/db.migrations.ts
import type Database from "better-sqlite3";

/**
 * Führt idempotente Migrationen aus. Nutzt PRAGMA user_version für Versionierung.
 * - Erzeugt Tabellen/Indizes mit IF NOT EXISTS
 * - Hebt Version nur nach erfolgreichem Schritt an
 */
export function ensureSchema(db: Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const getVersion = (): number =>
    Number(db.prepare("PRAGMA user_version").pluck().get());

  const run = db.transaction(() => {
    let v = getVersion();

    // v0 -> v1: Basis-Tabellen
    if (v < 1) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS articles (
          id INTEGER PRIMARY KEY,
          articleNumber TEXT NOT NULL,          -- muss UNIQUE sein für ON CONFLICT
          ean TEXT,
          name TEXT,
          price REAL,
          unit TEXT,
          productGroup TEXT,
          category_id INTEGER,
          updated_at INTEGER,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );
      `);

      db.exec("PRAGMA user_version = 1");
      v = 1;
    }

    // Spalte updated_at nachrüsten, falls in bestehender DB noch nicht vorhanden
    const cols = db.prepare("PRAGMA table_info(articles)").all() as any[];
    if (!cols.some((c) => c.name === "updated_at")) {
      db.exec("ALTER TABLE articles ADD COLUMN updated_at INTEGER");
    }

    // Indizes sicherstellen (idempotent)
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_articlenumber
        ON articles(articleNumber);
      CREATE INDEX IF NOT EXISTS idx_articles_ean ON articles(ean);
      CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at);
    `);

    // v1 -> v2: Beispiel für spätere Spalten/Indizes (nur Muster)
    // if (v < 2) {
    //   db.exec(`ALTER TABLE articles ADD COLUMN someNewCol TEXT;`);
    //   db.exec("PRAGMA user_version = 2");
    // }
  });

  run(); // Transaktion ausführen

  ensureFts(db);
  backfillArticlesFts(db);
}

/**
 * Stellt die contentless FTS5-Tabelle und die zugehörigen Trigger für 'articles' idempotent her.
 */
function ensureFts(db: Database) {
  // Prüfen, ob FTS5 verfügbar ist (optional, aber hilfreich fürs Log)
  try {
    db.prepare("SELECT 1 FROM pragma_compile_options WHERE compile_options LIKE 'FTS5%'").get();
  } catch {
    /* ignore – manche Builds führen das nicht */
  }

  // Existenz der FTS-Tabelle prüfen
  const fts = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='articles_fts'")
    .get();

  // In einer Transaktion alles sauber herstellen
  db.transaction(() => {
    if (!fts) {
      // Contentless FTS5 (keine 'content=' Verknüpfung; Trigger pflegen Index manuell)
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts
        USING fts5(
          articleNumber,
          name,
          ean,
          category_name,
          content=''
        );
      `);
    } else {
      // Optional: Schema der FTS-Spalten prüfen (pragma fts5vocab) – bei Abweichung neu erstellen
      // Vereinfachung: wir gehen von passendem Schema aus oder recreaten über DROP/CREATE falls nötig.
    }

    // Trigger immer deterministisch neu anlegen
    db.exec(`
      DROP TRIGGER IF EXISTS articles_ai;
      DROP TRIGGER IF EXISTS articles_au;
      DROP TRIGGER IF EXISTS articles_ad;

      CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN
        INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        VALUES (
          new.id,
          new.articleNumber,
          new.name,
          new.ean,
          (SELECT name FROM categories WHERE id = new.category_id)
        );
      END;

      CREATE TRIGGER articles_au AFTER UPDATE ON articles BEGIN
        INSERT INTO articles_fts(articles_fts, rowid) VALUES('delete', old.id);
        INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
        VALUES (
          new.id,
          new.articleNumber,
          new.name,
          new.ean,
          (SELECT name FROM categories WHERE id = new.category_id)
        );
      END;

      CREATE TRIGGER articles_ad AFTER DELETE ON articles BEGIN
        INSERT INTO articles_fts(articles_fts, rowid) VALUES('delete', old.id);
      END;
    `);
  })();
}

// optionaler Backfill – einmalig nach ensureFts(db)
function backfillArticlesFts(db: Database) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM articles_fts").get()?.c ?? 0;
  if (count > 0) return; // schon befüllt

  db.exec(`
    INSERT INTO articles_fts(rowid, articleNumber, name, ean, category_name)
    SELECT
      a.id,
      a.articleNumber,
      a.name,
      a.ean,
      (SELECT name FROM categories WHERE id = a.category_id)
    FROM articles a;
  `);
}
