CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warengruppen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hauptgruppe TEXT(3),
  gruppe TEXT(10),
  bezeichnung TEXT(40)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_warengruppe_code ON warengruppen(hauptgruppe, gruppe);

CREATE TABLE IF NOT EXISTS rabattgruppen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nummer TEXT(4),
  bezeichnung TEXT(40)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rabatt_nummer ON rabattgruppen(nummer);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artnr TEXT(15) UNIQUE,
  kurztext1 TEXT(40),
  kurztext2 TEXT(40),
  einheit TEXT(4),
  ean TEXT,
  matchcode TEXT(15),
  hersteller_nr TEXT,
  katalogseite TEXT,
  steuer_merker TEXT,
  warengruppe_id INTEGER,
  rabattgruppe_id INTEGER,
  aktiv INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_articles_wg ON articles(warengruppe_id);
CREATE INDEX IF NOT EXISTS idx_articles_rg ON articles(rabattgruppe_id);

CREATE TABLE IF NOT EXISTS article_texts (
  article_id INTEGER PRIMARY KEY,
  langtext TEXT,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS article_sets (
  parent_id INTEGER,
  child_id INTEGER,
  menge TEXT,
  PRIMARY KEY(parent_id, child_id),
  FOREIGN KEY(parent_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY(child_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,
  typ TEXT,
  betrag_cent INTEGER,
  einheit TEXT,
  gueltig_ab TEXT,
  gueltig_bis TEXT,
  kundennr TEXT,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_prices_article ON prices(article_id);

CREATE TABLE IF NOT EXISTS price_tiers (
  price_id INTEGER,
  von_menge TEXT,
  zu_abaufschlag_cent INTEGER,
  PRIMARY KEY(price_id, von_menge),
  FOREIGN KEY(price_id) REFERENCES prices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,
  art TEXT(2),
  dateiname TEXT,
  beschreibung TEXT,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_media_article ON media(article_id);
