import fs from 'fs';
import path from 'path';
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
  upsertArticle,
  upsertWarengruppe,
  upsertRabattgruppe,
  setArticleText,
  insertPrice,
  insertPriceTier,
  insertMedia,
} from '../db';
import type { DatanormImportOptions, ImportResult } from './index';

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
  counts: any,
  errors: any[]
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
          const id = upsertWarengruppe({
            hauptgruppe: r.hauptgruppe,
            gruppe: r.gruppe,
            bezeichnung: r.bezeichnung,
          });
          (counts.warengruppen += 1);
          break;
        }
        case 'R': {
          const r = rec as RabattgruppeRecord;
          upsertRabattgruppe({ nummer: r.nummer, bezeichnung: r.bezeichnung });
          counts.rabattgruppen += 1;
          break;
        }
        case 'A': {
          const r = rec as ArticleRecord;
          const val = validateArticle(r, version);
          if (val.length) throw new Error(val.map((v) => `${v.field}:${v.message}`).join(','));
          const articleId = upsertArticle({
            ...r,
            warengruppe_id: undefined,
            rabattgruppe_id: undefined,
          });
          counts.articles += 1;
          break;
        }
        case 'B': {
          const r = rec as ArticleAddRecord;
          const articleId = upsertArticle({
            type: 'A',
            artnr: r.artnr,
            kurztext1: '',
            kurztext2: '',
            einheit: '',
            katalogseite: r.katalogseite,
            steuer_merker: r.steuer_merker,
          } as any);
          break;
        }
        case 'T': {
          const r = rec as TextRecord;
          if (!state.articleTexts[r.artnr]) state.articleTexts[r.artnr] = [];
          state.articleTexts[r.artnr].push(r.text);
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
            counts.prices += 1;
          }
          break;
        }
        case 'Z': {
          const r = rec as PriceTierRecord;
          const priceId = state.lastPriceId[r.artnr];
          if (priceId) {
            const cents = Math.round(parseFloat(r.aufabschlag.replace(',', '.')) * 100);
            insertPriceTier({ price_id: priceId, von_menge: r.von_menge, zu_abaufschlag_cent: cents });
            counts.priceTiers += 1;
          }
          break;
        }
        case 'G': {
          const r = rec as MediaRecord;
          const art = db.prepare('SELECT id FROM articles WHERE artnr=?').get(r.artnr);
          if (art) {
            insertMedia({ article_id: art.id, art: r.art, dateiname: r.dateiname, beschreibung: r.beschreibung });
            counts.media += 1;
          }
          break;
        }
        case 'E':
          break;
        default:
          skipped++;
      }
      ok++;
    } catch (e: any) {
      err++;
      errors.push({ file: file.name, line: lineNo, error: e.message });
    }
    opts.onProgress?.({ file: file.name, line: lineNo, ok, skipped, errors: err });
  }
  // flush texts
  for (const artnr of Object.keys(state.articleTexts)) {
    const art = db.prepare('SELECT id FROM articles WHERE artnr=?').get(artnr);
    if (art) {
      setArticleText(art.id, state.articleTexts[artnr].join('\n'));
      counts.texts += 1;
    }
  }
  return { lines: lineNo, errors: err };
}

export async function runImport(opts: DatanormImportOptions): Promise<ImportResult> {
  const files = await resolveInputFiles(opts.input);
  const counts = {
    articles: 0,
    texts: 0,
    warengruppen: 0,
    rabattgruppen: 0,
    prices: 0,
    priceTiers: 0,
    media: 0,
    sets: 0,
    errors: 0,
  };
  const errors: any[] = [];
  let version: 'v4' | 'v5' | null = null;
  const db = getDb();
  for (const f of files) {
    const firstLine = fs.readFileSync(f.path, { encoding: 'utf8' }).split(/\r?\n/)[0];
    const v = opts.version && opts.version !== 'auto' ? opts.version : detectVersion(firstLine);
    if (!version) version = v;
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
  counts.errors = errors.length;
  const reportDir = path.join(process.cwd(), '.datanorm');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `import-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ errors }, null, 2), 'utf8');
  return {
    version: version || 'v5',
    filesProcessed: files.map((f) => f.name),
    counts,
    reportPath,
  };
}
