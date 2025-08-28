import * as fs from 'fs';
import * as path from 'path';
import iconv from 'iconv-lite';
import { resolveInputFiles, InputFile } from './io';
import { parseV4Line } from './parsers/v4';
import { parseV5Line } from './parsers/v5';
import {
  AnyRecord,
  ArticleRecord,
  ArticleAddRecord,
  TextRecord,
  PriceRecord,
  PriceTierRecord,
  WarengruppeRecord,
  RabattgruppeRecord,
  MediaRecord,
} from './records';
import { validateArticle, validatePrice } from './validator';
import {
  getDb,
  closeDb,
  upsertArticle,
  upsertWarengruppe,
  upsertRabattgruppe,
  setArticleText,
  insertPrice,
  insertPriceTier,
  insertMedia,
  type ArticleRow,
} from '../db';
import type { DatanormImportOptions } from './index';

type CountRow = { c: number };

type ImportCounts = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
};

type ImportError = {
  line?: number;
  message: string;
};

export type ImportResult = {
  version: 'v4' | 'v5';
  counts: { articles: number; texts: number; media: number };
  dbPath: string;
  reportPath?: string;
};

interface ProcessState {
  articleTexts: Record<string, string[]>;
  lastPriceId: Record<string, number>;
}

function detectVersion(line: string): 'v4' | 'v5' {
  return line.includes(';') ? 'v5' : 'v4';
}

function processFile(
  file: InputFile,
  version: 'v4' | 'v5',
  opts: DatanormImportOptions,
  state: ProcessState,
  counts: ImportCounts,
  errors: ImportError[]
): { lines: number; errors: number } {
  const db = getDb();
  const buf = fs.readFileSync(file.path);
  const text = iconv.decode(buf, 'cp850');
  const lines = text.split(/\r?\n/);
  let lineNo = 0;
  let ok = 0;
  let err = 0;
  let skipped = 0;
  let loggedArticles = 0;
  for (const line of lines) {
    lineNo++;
    if (!line.trim()) continue;
    const rec = version === 'v5' ? parseV5Line(line) : parseV4Line(line);
    if (!rec) continue;
    if ((rec.type === 'A' || rec.type === 'B') && loggedArticles < 3) {
      if (loggedArticles === 0) {
        console.debug('First article record', rec);
      }
      console.debug('Article artnr', (rec as ArticleRecord | ArticleAddRecord).artnr);
      loggedArticles++;
    }
    try {
      switch (rec.type) {
        case 'S': {
          const r = rec as WarengruppeRecord;
          upsertWarengruppe({
            hauptgruppe: r.hauptgruppe,
            gruppe: r.gruppe,
            bezeichnung: r.bezeichnung,
          });
          counts.inserted++;
          break;
        }
        case 'R': {
          const r = rec as RabattgruppeRecord;
          upsertRabattgruppe({ nummer: r.nummer, bezeichnung: r.bezeichnung });
          counts.inserted++;
          break;
        }
        case 'A': {
          const r = rec as ArticleRecord;
          const val = validateArticle(r, version);
          if (val.length) throw new Error(val.map((v) => `${v.field}:${v.message}`).join(','));
          const { id } = upsertArticle({
            ...r,
            warengruppe_id: undefined,
            rabattgruppe_id: undefined,
          });
          console.debug('Upsert article id', id, 'for', r.artnr);
          if (!id) console.debug('Upsert returned no id for', r.artnr);
          counts.inserted++;
          break;
        }
        case 'B': {
          const r = rec as ArticleAddRecord;
          const { id } = upsertArticle({
            type: 'A',
            artnr: r.artnr,
            kurztext1: '',
            kurztext2: '',
            einheit: '',
            katalogseite: r.katalogseite,
            steuer_merker: r.steuer_merker,
          } as any);
          console.debug('Upsert article id', id, 'for', r.artnr);
          if (!id) console.debug('Upsert returned no id for', r.artnr);
          counts.inserted++;
          break;
        }
        case 'T': {
          const r = rec as TextRecord;
          if (!state.articleTexts[r.artnr]) state.articleTexts[r.artnr] = [];
          state.articleTexts[r.artnr].push(r.text);
          counts.inserted++;
          break;
        }
        case 'P': {
          const r = rec as PriceRecord;
          const val = validatePrice(r, version);
          if (val.length) throw new Error(val.map((v) => `${v.field}:${v.message}`).join(','));
          const art = db
            .prepare('SELECT id, artnr FROM articles WHERE artnr=?')
            .get(r.artnr) as ArticleRow | undefined;
          if (art) {
            const cents = Math.round(parseFloat(r.betrag.replace(',', '.')) * 100);
            const priceId = insertPrice({
              article_id: art.id,
              typ: r.kennzeichen === '1' ? 'BRUTTO' : 'NETTO',
              betrag_cent: cents,
              einheit: r.einheit,
              gueltig_ab: r.gueltig_ab,
              gueltig_bis: r.gueltig_bis,
              kundennr: r.kundennr,
            });
            state.lastPriceId[r.artnr] = priceId;
            counts.inserted++;
          }
          break;
        }
        case 'Z': {
          const r = rec as PriceTierRecord;
          const priceId = state.lastPriceId[r.artnr];
          if (priceId) {
            const cents = Math.round(parseFloat(r.aufabschlag.replace(',', '.')) * 100);
            insertPriceTier({ price_id: priceId, von_menge: r.von_menge, zu_abaufschlag_cent: cents });
            counts.inserted++;
          }
          break;
        }
        case 'G': {
          const r = rec as MediaRecord;
          const art = db
            .prepare('SELECT id, artnr FROM articles WHERE artnr=?')
            .get(r.artnr) as ArticleRow | undefined;
          if (art) {
            insertMedia({ article_id: art.id, art: r.art, dateiname: r.dateiname, beschreibung: r.beschreibung });
            counts.inserted++;
          }
          break;
        }
        case 'E':
          break;
        default:
          skipped++;
          counts.skipped++;
      }
      ok++;
    } catch (e: any) {
      err++;
      errors.push({ line: lineNo, message: e instanceof Error ? e.message : String(e) });
    }
    opts.onProgress?.({ file: file.name, line: lineNo, ok, skipped, errors: err });
  }
  // flush texts
  for (const artnr of Object.keys(state.articleTexts)) {
    const texts = state.articleTexts[artnr];
    console.debug('Have article texts for', artnr, 'len', texts.length);
    const art = db
      .prepare('SELECT id, artnr FROM articles WHERE artnr=?')
      .get(artnr) as ArticleRow | undefined;
    if (art) {
      const info = setArticleText(art.id, texts.join('\n'));
      console.debug('Insert text result', info);
      counts.inserted++;
    }
  }
  return { lines: lineNo, errors: err };
}

export async function runImport(opts: DatanormImportOptions): Promise<ImportResult> {
  const files = await resolveInputFiles(opts.input);
  const dbPath = path.join(opts.input, 'datanorm.sqlite');
  closeDb();
  const db = getDb(dbPath);

  const errors: ImportError[] = [];
  const counts: ImportCounts = { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  let version: 'v4' | 'v5' = 'v5';
  const reportPath = path.join(opts.input, 'datanorm-import-report.json');

  try {
    const tx = db.transaction(() => {
      for (const f of files) {
        const firstLine = fs.readFileSync(f.path, { encoding: 'utf8' }).split(/\r?\n/)[0];
        const v = opts.version && opts.version !== 'auto' ? opts.version : detectVersion(firstLine);
        version = v;
        const state: ProcessState = { articleTexts: {}, lastPriceId: {} };
        const result = processFile(f, v as 'v4' | 'v5', opts, state, counts, errors);
        const ratio = result.lines ? result.errors / result.lines : 0;
        if (opts.dryRun || ratio > 0.05) {
          throw new Error('rollback');
        }
      }
    });
    tx();
  } catch (e) {
    errors.push({ message: e instanceof Error ? e.message : String(e) });
  }

  let tableCounts = { articles: 0, texts: 0, media: 0 };
  try {
    const getCount = (sql: string) => (db.prepare(sql).get() as CountRow).c;
    tableCounts = {
      articles: getCount('SELECT COUNT(*) AS c FROM articles'),
      texts:    getCount('SELECT COUNT(*) AS c FROM article_texts'),
      media:    getCount('SELECT COUNT(*) AS c FROM media'),
    };
  } catch {}

  counts.errors = errors.length;
  try {
    fs.writeFileSync(reportPath, JSON.stringify({ errors }, null, 2), 'utf8');
  } catch {
    // ignore
  }
  closeDb();

  return { version, counts: tableCounts, dbPath, reportPath } satisfies ImportResult;
}
