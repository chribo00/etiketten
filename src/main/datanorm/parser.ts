import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import iconv from 'iconv-lite';

export interface ParsedArticle {
  articleNumber: string;
  name: string;
  ean: string | null;
  price: number;
  unit: string | null;
  productGroup: string | null;
  tiers?: { qty: number; price: number }[];
  longText?: string;
  imageRef?: string;
}

function readFileLines(file: string): string[] {
  const buf = fs.readFileSync(file);
  let text = iconv.decode(buf, 'utf8');
  if (text.includes('\uFFFD')) {
    try {
      text = iconv.decode(buf, 'cp850');
    } catch {
      /* ignore */
    }
  }
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0);
}

function detectVersion(lines: string[]): 4 | 5 {
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('V')) {
      if (/05/.test(t)) return 5;
      return 4;
    }
  }
  return 4;
}

function toInt(v?: string): number {
  if (!v) return 0;
  const n = parseInt(v.replace(/[^0-9-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function findEAN(tokens: string[]): string | null {
  const e = tokens.find((x) => /^\d{12,14}$/.test(x.trim()));
  return e ? e.trim() : null;
}

function lastNonEmpty(tokens: string[]): string | null {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const v = tokens[i]?.trim();
    if (v) return v;
  }
  return null;
}

export function parseDatanorm(filePathOrZip: string): ParsedArticle[] {
  const files: string[] = [];
  if (filePathOrZip.toLowerCase().endsWith('.zip')) {
    const zip = new AdmZip(filePathOrZip);
    for (const entry of zip.getEntries()) {
      if (entry.entryName.toLowerCase().endsWith('.txt') || entry.entryName.toLowerCase().endsWith('.asc') || entry.entryName.toLowerCase().endsWith('.001')) {
        const tmp = path.join(process.cwd(), entry.entryName);
        fs.writeFileSync(tmp, entry.getData());
        files.push(tmp);
      }
    }
  } else {
    files.push(filePathOrZip);
  }

  const map = new Map<string, ParsedArticle>();

  for (const file of files) {
    const lines = readFileLines(file);
    const version = detectVersion(lines);
    for (const line of lines) {
      const t = line.split(';');
      const type = t[0];
      if (!type) continue;
      if (type === 'A') {
        const articleNumber = (t[2] || '').trim();
        if (!articleNumber) continue;
        const name = [t[4], t[5]].filter(Boolean).join(' ').trim();
        const priceUnitFactor = Number(t[6] || '1') || 1;
        const unit = (t[8] || '').trim() || null;
        const priceCents = toInt(t[9]);
        const price = priceCents / 100 / priceUnitFactor;
        map.set(articleNumber, {
          articleNumber,
          name,
          ean: null,
          price,
          unit,
          productGroup: null,
          tiers: [],
        });
      } else if (type === 'B') {
        const artNr = (t[2] || '').trim();
        if (!artNr) continue;
        if (version === 5) {
          continue; // V5 B-satz meist für Löschungen/Nummernänderungen
        }
        const article = map.get(artNr) || {
          articleNumber: artNr,
          name: '',
          ean: null,
          price: 0,
          unit: null,
          productGroup: null,
          tiers: [],
        };
        const groupTok = lastNonEmpty(t);
        const pg = groupTok && /^AG/i.test(groupTok) ? groupTok : null;
        const ean = findEAN(t);
        if (pg && !article.productGroup) article.productGroup = pg;
        if (ean && !article.ean) article.ean = ean;
        map.set(artNr, article);
      } else if (type === 'T') {
        const artNr = (t[2] || '').trim();
        if (!artNr) continue;
        const article = map.get(artNr) || {
          articleNumber: artNr,
          name: '',
          ean: null,
          price: 0,
          unit: null,
          productGroup: null,
          tiers: [],
        };
        const text = t.slice(3).join(' ').trim();
        article.longText = article.longText ? `${article.longText}\n${text}` : text;
        map.set(artNr, article);
      } else if (type === 'Z') {
        const artNr = (t[2] || '').trim();
        if (!artNr) continue;
        const qty = toInt(t[3]);
        const priceCents = toInt(t[4]);
        const price = priceCents / 100;
        const article = map.get(artNr) || {
          articleNumber: artNr,
          name: '',
          ean: null,
          price: 0,
          unit: null,
          productGroup: null,
          tiers: [],
        };
        if (!article.tiers) article.tiers = [];
        if (qty > 0) article.tiers.push({ qty, price });
        map.set(artNr, article);
      } else if (type === 'G') {
        const artNr = (t[2] || '').trim();
        if (!artNr) continue;
        const article = map.get(artNr) || {
          articleNumber: artNr,
          name: '',
          ean: null,
          price: 0,
          unit: null,
          productGroup: null,
          tiers: [],
        };
        article.imageRef = t[3]?.trim();
        map.set(artNr, article);
      }
    }
  }

  const result: ParsedArticle[] = [];
  for (const art of map.values()) {
    const ean = art.ean && /^\d{12,14}$/.test(art.ean) ? art.ean : null;
    result.push({
      articleNumber: art.articleNumber.trim(),
      name: art.name.trim(),
      ean,
      price: art.price || 0,
      unit: art.unit ? art.unit.trim() : null,
      productGroup: art.productGroup ? art.productGroup.trim() : null,
      tiers: art.tiers && art.tiers.length ? art.tiers : undefined,
      longText: art.longText?.trim(),
      imageRef: art.imageRef,
    });
  }
  return result;
}

export default parseDatanorm;
