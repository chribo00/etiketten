import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';

import { ensureSchema } from '../src/main/db.migrations';

describe('ensureSchema', () => {
  test('initializes and runs twice without error', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrate-'));
    const db = new Database(path.join(dir, 'test.db'));
    ensureSchema(db);
    const version1 = db.pragma('user_version', { simple: true }) as number;
    ensureSchema(db);
    const version2 = db.pragma('user_version', { simple: true }) as number;
    expect(version1).toBe(1);
    expect(version2).toBe(1);
    const idx = db.prepare("PRAGMA index_list('articles')").all() as any[];
    const articleIdx = idx.find((i: any) => i.name === 'idx_articles_articlenumber');
    expect(articleIdx).toBeTruthy();
    expect(articleIdx.unique).toBe(0);
  });
});
