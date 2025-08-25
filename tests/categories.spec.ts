import fs from 'fs';
import os from 'os';
import path from 'path';

describe('Category CRUD', () => {
  function setup() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'etik-cat-'));
    process.env.TEST_DB_DIR = dir;
    jest.resetModules();
    return require('../src/main/db');
  }

  test('create and list', () => {
    const db = setup();
    const res = db.createCategory('Sanitär');
    expect(res.id).toBeGreaterThan(0);
    const list = db.listCategories();
    expect(list.find((c: any) => c.name === 'Sanitär')).toBeTruthy();
    const dup = db.createCategory('sanitär');
    expect(dup.error).toBe('DUPLICATE_NAME');
    const invalid = db.createCategory('');
    expect(invalid.error).toBe('VALIDATION_ERROR');
  });

  test('rename', () => {
    const db = setup();
    const c1 = db.createCategory('Sanitär');
    const ren = db.renameCategory(c1.id, 'Sanitär & Bad');
    expect(ren.changes).toBe(1);
    const list = db.listCategories();
    expect(list[0].name).toBe('Sanitär & Bad');
    const c2 = db.createCategory('Heizung');
    const dup = db.renameCategory(c2.id, 'Sanitär & Bad');
    expect(dup.error).toBe('DUPLICATE_NAME');
  });

  test('delete reassign to null', () => {
    const db = setup();
    const cat = db.createCategory('Heizung');
    db.upsertArticles([{ articleNumber: 'A1', name: 'Test', category_id: cat.id }]);
    const res = db.deleteCategory(cat.id, 'reassign', null);
    expect(res.deleted).toBe(true);
    const row = db.default.prepare('SELECT category_id FROM articles WHERE articleNumber=?').get('A1');
    expect(row.category_id).toBeNull();
  });

  test('delete with explicit reassign missing reports error', () => {
    const db = setup();
    const cat = db.createCategory('X');
    db.upsertArticles([{ articleNumber: 'A1', name: 'Test', category_id: cat.id }]);
    const res = db.deleteCategory(cat.id, 'reassign');
    expect(res.error).toBe('HAS_ARTICLES');
  });

  test('delete articles', () => {
    const db = setup();
    const cat = db.createCategory('Temp');
    db.upsertArticles([{ articleNumber: 'A1', name: 'Test', category_id: cat.id }]);
    const res = db.deleteCategory(cat.id, 'deleteArticles');
    expect(res.deleted).toBe(true);
    const cnt = db.default.prepare('SELECT COUNT(*) as c FROM articles').get();
    expect(cnt.c).toBe(0);
  });
});
