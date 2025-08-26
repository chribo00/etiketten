import * as fs from 'fs';
import * as path from 'path';
import readline from 'readline';
import { decodeCp850 } from './encoding';
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
} from '../db';
import type { DatanormImportOptions } from './index';

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
  counts: ImportCounts;
  reportPath?: string;
};

interface ProcessState {
  articleTexts: Record<string, string[]>;
  lastPriceId: Record<string, number>;
}

function detectVersion(line: string): 'v4' | 'v5' {
  return line.includes(';') ? 'v5' : 'v4';
}

async function processFile(
  file: InputFile,
  version: 'v4' | 'v5',
  opts: DatanormImportOptions,
  state: ProcessState,
  counts: ImportCounts,
  errors: ImportError[]
): Promise<{ lines: number; errors: number }> {
  const db = getDb();
  const rl = readline.createInterface({
    input: decodeCp850(fs.createReadStream(file.path)),
    crlfDelay: Infinity,
  });
  let lineNo = 0;
  let ok = 0;
  let err = 0;
  let skipped = 0;
  const parsed: AnyRecord[] = [];
  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    const rec = version === 'v5' ? parseV5Line(line) : parseV4Line(line);
    if (!rec) continue;
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
          upsertArticle({
            ...r,
            warengruppe_id: undefined,
            rabattgruppe_id: undefined,
          });
          counts.inserted++;
          break;
        }
        case 'B': {
          const r = rec as ArticleAddRecord;
          upsertArticle({
            type: 'A',
            artnr: r.artnr,
            kurztext1: '',
            kurztext2: '',
            einheit: '',
            katalogseite: r.katalogseite,
            steuer_merker: r.steuer_merker,
          } as any);
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
          const art = db.prepare('SELECT id FROM articles WHERE artnr=?').get(r.artnr);
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
          const art = db.prepare('SELECT id FROM articles WHERE artnr=?').get(r.artnr);
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
    const art = db.prepare('SELECT id FROM articles WHERE artnr=?').get(artnr);
    if (art) {
      setArticleText(art.id, state.articleTexts[artnr].join('\n'));
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
    for (const f of files) {
      const firstLine = fs.readFileSync(f.path, { encoding: 'utf8' }).split(/\r?\n/)[0];
      const v = opts.version && opts.version !== 'auto' ? opts.version : detectVersion(firstLine);
      version = v;
      const state: ProcessState = { articleTexts: {}, lastPriceId: {} };
      db.exec('BEGIN');
      const result = await processFile(f, v as 'v4' | 'v5', opts, state, counts, errors);
      const ratio = result.lines ? result.errors / result.lines : 0;
      if (opts.dryRun || ratio > 0.05) {
        db.exec('ROLLBACK');
      } else {
        db.exec('COMMIT');
      }
    }
  } catch (e) {
    errors.push({ message: e instanceof Error ? e.message : String(e) });
  } finally {
    counts.errors = errors.length;
    try {
      fs.writeFileSync(reportPath, JSON.stringify({ errors }, null, 2), 'utf8');
    } catch {
      // ignore
    }
    closeDb();
  }
  return { version, counts, reportPath } satisfies ImportResult;
}
