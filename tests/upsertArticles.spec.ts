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
    expect(res1.inserted + res1.updated).toBe(53);
    const res2 = upsertArticles(batch);
    expect(res2.inserted).toBe(0);
    expect(res2.updated).toBe(53);
  });
});

