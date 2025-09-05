import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('electron', () => ({
  app: {
    getPath: () => fs.mkdtempSync(path.join(os.tmpdir(), 'db-')),
  },
}));

import { clearArticles, upsertArticles } from '../src/main/db';

describe('upsertArticles', () => {
  test('imports and updates 53 rows', () => {
    clearArticles();
    const batch = Array.from({ length: 53 }, (_, i) => ({
      articleNumber: i === 0 ? 'degu123' : `art${i}`,
      name: `Artikel ${i}`,
      price: i,
      unit: 'St',
      productGroup: null,
      category_id: null,
      ean: null,
    }));
    const res1 = upsertArticles(batch);
    const ins1 = res1.filter((r) => r.status === 'inserted').length;
    const upd1 = res1.filter((r) => r.status === 'updated').length;
    expect(ins1 + upd1).toBe(53);
    const res2 = upsertArticles(batch);
    const ins2 = res2.filter((r) => r.status === 'inserted').length;
    const upd2 = res2.filter((r) => r.status === 'updated').length;
    expect(ins2).toBe(0);
    expect(upd2).toBe(53);
  });
});

