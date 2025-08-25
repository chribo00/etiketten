import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { upsertArticles } from '../db';

export async function importDatanormFile({
  filePath,
  mapping,
  categoryId,
}: {
  filePath: string;
  mapping?: {
    articleNumber?: boolean;
    ean?: boolean;
    shortText?: boolean;
    price?: boolean;
    unit?: boolean;
    productGroup?: boolean;
  };
  categoryId?: number;
}): Promise<{ parsed: number; inserted: number; updated: number; durationMs: number }> {
  if (!path.isAbsolute(filePath)) throw new Error('Pfad muss absolut sein');
  if (!fs.existsSync(filePath)) throw new Error('Datei nicht gefunden');
  if (fs.statSync(filePath).size <= 0) throw new Error('Datei ist leer');

  const start = Date.now();
  const byArtNr = new Map<string, any>();
  let version: 4 | 5 = 4;
  let versionFound = false;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });
  let lineNo = 0;
  let lastLine = '';
  try {
    for await (const line of rl) {
      lineNo++;
      lastLine = line;
      if (!versionFound && line.startsWith('V')) {
        versionFound = true;
        version = /05/.test(line) ? 5 : 4;
        continue;
      }
      const t = line.split(';');
      const type = t[0];
      if (!type) continue;
      if (type === 'A') {
        const articleNumber = (t[2] || '').trim();
        if (!articleNumber) continue;
        const name = [t[4], t[5]].filter(Boolean).join(' ').trim();
        const priceUnitFactor = Number(t[6] || '1') || 1;
        const unit = (t[8] || '').trim() || null;
        const priceCents = Number((t[9] || '').replace(/[^0-9-]/g, '')) || 0;
        const price = priceCents / 100 / priceUnitFactor;
        byArtNr.set(articleNumber, {
          articleNumber,
          name,
          ean: null,
          price,
          unit,
          productGroup: null,
        });
      } else if (type === 'B') {
        const artNr = (t[2] || '').trim();
        if (!artNr) continue;
        if (version === 5) continue;
        const item =
          byArtNr.get(artNr) || {
            articleNumber: artNr,
            name: '',
            ean: null,
            price: 0,
            unit: null,
            productGroup: null,
          };
        const groupTok = [...t].reverse().find((v) => v && v.trim());
        const pg = groupTok && /^AG/i.test(groupTok.trim()) ? groupTok.trim() : null;
        const ean = t.find((v) => v && /^\d{12,14}$/.test(v.trim()));
        if (pg && !item.productGroup) item.productGroup = pg;
        if (ean && !item.ean) item.ean = ean.trim();
        byArtNr.set(artNr, item);
      }
    }
  } catch (err) {
    console.error('Parse error at line', lineNo, lastLine, err);
    throw err;
  } finally {
    rl.close();
  }

  const arr = Array.from(byArtNr.values()).map((raw) => {
    const item = {
      articleNumber: String(raw.articleNumber || '').trim(),
      ean: raw.ean ? String(raw.ean).trim() : null,
      name:
        (raw.name ?? raw.shortText ?? raw.kurztext ?? '').toString().trim() ||
        '(ohne Bezeichnung)',
      price: Number(raw.price ?? 0),
      unit: raw.unit ?? null,
      productGroup: raw.productGroup ?? null,
      category_id: categoryId ?? null,
    } as any;
    if (mapping?.ean === false) item.ean = null;
    if (mapping?.price === false) item.price = 0;
    if (mapping?.shortText === false) item.name = '(ohne Bezeichnung)';
    return item;
  });

  const { inserted, updated } = upsertArticles(arr);
  const durationMs = Date.now() - start;
  return { parsed: arr.length, inserted, updated, durationMs };
}
