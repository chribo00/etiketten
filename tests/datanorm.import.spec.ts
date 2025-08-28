import fs from 'fs';
import os from 'os';
import path from 'path';
import iconv from 'iconv-lite';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { importDatanorm } from '../src/datanorm';
import type { ArticleRow } from '../src/db';
type LangTextRow = { langtext: string };
type CountRow = { c: number };

function tmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function pad(val: string, len: number): string {
  return (val || '').padEnd(len, ' ');
}

describe('DATANORM Import', () => {
  test('imports v5 data with encoding', async () => {
    const dir = tmpDir('dnv5-');
    const lines = [
      'V;ERST;EUR;20240101',
      'S;001;001;WGr\u00e4te',
      'R;0001;Rabatt',
      'A;ART1;Kurztext1;Kurztext2;ST;123456789012345678;MATCH1;001;0001',
      'B;ART1;10;T',
      'T;ART1;Langtext1 \u00e4',
      'T;ART1;Langtext2',
      'P;ART1;1;12,34;ST;20240101;20241231',
      'Z;ART1;10;1,00',
      'G;ART1;I;bild.jpg;Bild',
      'E',
    ];
    const buf = iconv.encode(lines.join('\n'), 'cp850');
    fs.writeFileSync(path.join(dir, 'DATANORM.001'), buf);
    process.chdir(dir);
    const res = await importDatanorm({ input: dir });
    expect(res.version).toBe('v5');
    const db = new Database(path.join(dir, 'datanorm.sqlite'));
    // better-sqlite3 typings geben .get() als unknown zurück – für TS-Strictness hier gezielt typisieren.
    const art = db
      .prepare('SELECT * FROM articles')
      .get() as ArticleRow | undefined;
    expect(art).toBeDefined();
    expect(art!.artnr).toBe('ART1');
    const txt = db
      .prepare('SELECT langtext FROM article_texts')
      .get() as LangTextRow | undefined;
    expect(txt).toBeDefined();
    expect(txt!.langtext).toBe('Langtext1 ä\nLangtext2');
    const media = db
      .prepare('SELECT COUNT(*) as c FROM media')
      .get() as CountRow | undefined;
    expect(media).toBeDefined();
    expect(media!.c).toBe(1);
  });

  test('imports v4 data', async () => {
    const dir = tmpDir('dnv4-');
    const a =
      'A' +
      pad('ART2', 15) +
      pad('Kurztext1', 40) +
      pad('Kurztext2', 40) +
      pad('ST', 4) +
      pad('1234567890123', 13) +
      pad('MATCH2', 15) +
      pad('001', 10) +
      pad('0001', 4);
    const t = 'T' + pad('ART2', 15) + pad('Langtext', 40);
    const p =
      'P' +
      pad('ART2', 15) +
      pad('1', 1) +
      pad('001234', 8) +
      pad('ST', 4) +
      pad('20240101', 8) +
      pad('20241231', 8);
    const lines = ['V', 'S001001WGr', 'R0001Rabatt', a, t, p, 'E'];
    fs.writeFileSync(path.join(dir, 'DATANORM.001'), lines.join('\n'));
    process.chdir(dir);
    const res = await importDatanorm({ input: dir });
    expect(res.version).toBe('v4');
    const db = new Database(path.join(dir, 'datanorm.sqlite'));
    const art = db
      .prepare('SELECT * FROM articles')
      .get() as ArticleRow | undefined;
    expect(art).toBeDefined();
    expect(art!.artnr).toBe('ART2');
  });

  test('rollback on high error ratio', async () => {
    const dir = tmpDir('dnerr-');
    const good =
      'A' +
      pad('A1', 15) +
      pad('T1', 40) +
      pad('', 40) +
      pad('ST', 4) +
      pad('', 13) +
      pad('', 15) +
      pad('', 10) +
      pad('', 4);
    const bad =
      'A' +
      pad('TOO-LONG-ARTICLE-NUMBER', 15) +
      pad('T2', 40) +
      pad('', 40) +
      pad('ST', 4) +
      pad('', 13) +
      pad('', 15) +
      pad('', 10) +
      pad('', 4);
    fs.writeFileSync(path.join(dir, 'DATANORM.001'), [good, bad, 'E'].join('\n'));
    process.chdir(dir);
    const res = await importDatanorm({ input: dir });
    const db = new Database(path.join(dir, 'datanorm.sqlite'));
    const count = db
      .prepare('SELECT COUNT(*) as c FROM articles')
      .get() as CountRow | undefined;
    expect(count).toBeDefined();
    expect(count!.c).toBe(0);
  });
});
