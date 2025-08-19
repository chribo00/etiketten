import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { upsertArticles } from '../db';
import type { WebContents } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc';

export interface ArticleInput {
  id: string;
  articleNumber: string;
  name?: string;
  shortText?: string;
  longText?: string;
  ean?: string;
  listPrice?: number;
  imagePath?: string;
  brand?: string;
  groupCode?: string;
  uom?: string;
}

export function parseFixedWidth(line: string, spec: Array<{ field: string; width: number }>): any {
  let offset = 0;
  const obj: any = {};
  for (const s of spec) {
    obj[s.field] = line.slice(offset, offset + s.width).trim();
    offset += s.width;
  }
  return obj;
}

export function parseCsv(line: string, sep = ';'): string[] {
  return line.split(sep).map((s) => s.trim());
}

export async function importDatanorm(filePathOrZip: string, sender?: WebContents): Promise<number> {
  const files: string[] = [];
  if (filePathOrZip.toLowerCase().endsWith('.zip')) {
    const zip = new AdmZip(filePathOrZip);
    for (const entry of zip.getEntries()) {
      if (entry.entryName.toLowerCase().endsWith('.txt') || entry.entryName.toLowerCase().endsWith('.asc')) {
        const tmp = path.join(process.cwd(), entry.entryName);
        fs.writeFileSync(tmp, entry.getData());
        files.push(tmp);
      }
    }
  } else {
    files.push(filePathOrZip);
  }

  let imported = 0;
  let total = 0;
  const allLines: string[][] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const filtered = lines.filter((l) => l.trim().length > 0);
    total += filtered.length;
    allLines.push(filtered);
  }

  for (const lines of allLines) {
    const batch: ArticleInput[] = [];
    for (const line of lines) {
      const cols = parseCsv(line);
      const article: ArticleInput = {
        id: cols[0],
        articleNumber: cols[0],
        shortText: cols[1],
        longText: cols[2],
        ean: cols[3],
        listPrice: parseFloat(cols[4] || '0'),
        uom: cols[5] || 'Stk',
      };
      batch.push(article);
      if (batch.length >= 1000) {
        upsertArticles(batch);
        imported += batch.length;
        sender?.send(IPC_CHANNELS.datanorm.importProgress, { processed: imported, total });
        batch.length = 0;
      }
    }
    if (batch.length) {
      upsertArticles(batch);
      imported += batch.length;
      sender?.send(IPC_CHANNELS.datanorm.importProgress, { processed: imported, total });
    }
  }
  return imported;
}
