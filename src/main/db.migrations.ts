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
}
