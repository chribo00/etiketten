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

  const getVersion = (): number => Number(db.prepare("PRAGMA user_version").pluck().get());

  const run = db.transaction(() => {
    let v = getVersion();

    // v0 -> v1: Basis-Tabellen + benötigte Indizes
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

        -- WICHTIG: UNIQUE-Index für UPSERT-Strategie
        CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_articlenumber
          ON articles(articleNumber);

        -- optionale Performance-Indizes (idempotent)
        CREATE INDEX IF NOT EXISTS idx_articles_ean ON articles(ean);
        CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at);
      `);

      db.exec("PRAGMA user_version = 1");
      v = 1;
    }

    // v1 -> v2: Beispiel für spätere Spalten/Indizes (nur Muster)
    // if (v < 2) {
    //   db.exec(`ALTER TABLE articles ADD COLUMN someNewCol TEXT;`);
    //   db.exec("PRAGMA user_version = 2");
    // }
  });

  run(); // Transaktion ausführen
}
