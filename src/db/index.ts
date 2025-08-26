import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { ArticleRecord } from '../datanorm/records';

let db: Database | null = null;

export function getDb(dbPath = path.join(process.cwd(), 'datanorm.sqlite')): Database {
  if (!db) {
    db = new Database(dbPath);
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);
  }
  return db;
}

export function closeDb() {
  if (db) {
    try {
      db.close();
    } finally {
      db = null;
    }
  }
}

export function withTransaction<T>(fn: () => T): T {
  const database = getDb();
  const tx = database.transaction(fn);
  return tx();
}

export function upsertWarengruppe(code: { hauptgruppe: string; gruppe: string; bezeichnung: string }): number {
  const db = getDb();
  const sel = db.prepare('SELECT id FROM warengruppen WHERE hauptgruppe=? AND gruppe=?');
  const row = sel.get(code.hauptgruppe, code.gruppe);
  if (row) {
    db.prepare('UPDATE warengruppen SET bezeichnung=? WHERE id=?').run(code.bezeichnung, row.id);
    return row.id as number;
  }
  const result = db
    .prepare('INSERT INTO warengruppen (hauptgruppe,gruppe,bezeichnung) VALUES (?,?,?)')
    .run(code.hauptgruppe, code.gruppe, code.bezeichnung);
  return result.lastInsertRowid as number;
}

export function upsertRabattgruppe(code: { nummer: string; bezeichnung: string }): number {
  const db = getDb();
  const row = db.prepare('SELECT id FROM rabattgruppen WHERE nummer=?').get(code.nummer);
  if (row) {
    db.prepare('UPDATE rabattgruppen SET bezeichnung=? WHERE id=?').run(code.bezeichnung, row.id);
    return row.id as number;
  }
  const res = db
    .prepare('INSERT INTO rabattgruppen (nummer,bezeichnung) VALUES (?,?)')
    .run(code.nummer, code.bezeichnung);
  return res.lastInsertRowid as number;
}

export function upsertArticle(rec: ArticleRecord & { warengruppe_id?: number; rabattgruppe_id?: number }): number {
  const db = getDb();
  const sel = db.prepare('SELECT id FROM articles WHERE artnr=?');
  const row = sel.get(rec.artnr);
  if (row) {
    db.prepare(
      `UPDATE articles SET kurztext1=@kurztext1, kurztext2=@kurztext2, einheit=@einheit, ean=@ean, matchcode=@matchcode, warengruppe_id=@warengruppe_id, rabattgruppe_id=@rabattgruppe_id, katalogseite=@katalogseite, steuer_merker=@steuer_merker, updated_at=CURRENT_TIMESTAMP WHERE id=@id`
    ).run({ ...rec, id: row.id });
    return row.id as number;
  }
  const res = db
    .prepare(
      `INSERT INTO articles (artnr, kurztext1, kurztext2, einheit, ean, matchcode, warengruppe_id, rabattgruppe_id, katalogseite, steuer_merker) VALUES (@artnr,@kurztext1,@kurztext2,@einheit,@ean,@matchcode,@warengruppe_id,@rabattgruppe_id,@katalogseite,@steuer_merker)`
    )
    .run(rec);
  return res.lastInsertRowid as number;
}

export function setArticleText(articleId: number, text: string) {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO article_texts (article_id, langtext) VALUES (?,?)').run(articleId, text);
}

export function insertPrice(rec: {
  article_id: number;
  typ: string;
  betrag_cent: number;
  einheit: string;
  gueltig_ab?: string;
  gueltig_bis?: string;
  kundennr?: string;
}): number {
  const db = getDb();
  const res = db
    .prepare(
      `INSERT INTO prices (article_id, typ, betrag_cent, einheit, gueltig_ab, gueltig_bis, kundennr) VALUES (@article_id,@typ,@betrag_cent,@einheit,@gueltig_ab,@gueltig_bis,@kundennr)`
    )
    .run(rec);
  return res.lastInsertRowid as number;
}

export function insertPriceTier(rec: { price_id: number; von_menge: string; zu_abaufschlag_cent: number }) {
  const db = getDb();
  db.prepare('INSERT INTO price_tiers (price_id,von_menge,zu_abaufschlag_cent) VALUES (?,?,?)').run(
    rec.price_id,
    rec.von_menge,
    rec.zu_abaufschlag_cent
  );
}

export function insertMedia(rec: { article_id: number; art: string; dateiname: string; beschreibung?: string }) {
  const db = getDb();
  db.prepare('INSERT INTO media (article_id, art, dateiname, beschreibung) VALUES (?,?,?,?)').run(
    rec.article_id,
    rec.art,
    rec.dateiname,
    rec.beschreibung
  );
}

export function insertSet(rec: { parent_id: number; child_id: number; menge: string }) {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO article_sets (parent_id, child_id, menge) VALUES (?,?,?)').run(
    rec.parent_id,
    rec.child_id,
    rec.menge
  );
}
