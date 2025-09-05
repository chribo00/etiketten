import Database from 'better-sqlite3';

export type ImportMapping = Partial<{
  articleNumber: string;
  ean: string;
  name: string;
  price: string;
  unit: string;
  productGroup: string;
  categoryName: string;
}>;

export type ImportOptions = {
  createMissingCategories?: boolean;
  dryRun?: boolean;
};

export type ImportRequest = {
  rows: Record<string, unknown>[];
  mapping: ImportMapping;
  options?: ImportOptions;
};

export type ImportResult = {
  ok: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    reason: string;
    raw: Record<string, unknown>;
    mapped: Record<string, unknown>;
  }>;
  errorCsv?: string;
};

export function runArticleImport(db: Database, req: ImportRequest): ImportResult {
  const { rows, mapping, options } = req;
  const opts = { createMissingCategories: false, dryRun: false, ...(options ?? {}) };

  const result: ImportResult = { ok: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };

  const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : v);
  const toNull = (v: unknown) => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string' && v.trim() === '') return null;
    return v;
  };
  const toPrice = (v: unknown): number | null => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      const s = v.replace(/\./g, '').replace(',', '.').trim();
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const get = (row: Record<string, unknown>, header?: string) =>
    header ? toNull(trim(row[header])) : null;

  const selectArticleId = db.prepare(`SELECT id FROM articles WHERE articleNumber = ?`);
  const insertArticleStmtBase = db.prepare(`
    INSERT INTO articles (articleNumber, name, price, unit, ean, productGroup, category_id, updated_at)
    VALUES (@articleNumber, @name, COALESCE(@price, 0), @unit, @ean, @productGroup, @category_id, CURRENT_TIMESTAMP)
  `);
  const updateArticleStmtFactory = (cols: string[]) =>
    db.prepare(`
      UPDATE articles
      SET ${cols.map((c) => `${c}=@${c}`).join(', ')}, updated_at=CURRENT_TIMESTAMP
      WHERE articleNumber=@articleNumber
    `);

  const ensureCategoryId = (name: string | null): number | null => {
    if (!name) return null;
    const row = db.prepare(`SELECT id FROM categories WHERE name = ?`).get(String(name)) as { id: number } | undefined;
    if (row?.id) return row.id;
    if (!opts.createMissingCategories) return null;
    const info = db.prepare(`INSERT INTO categories (name) VALUES (?)`).run(String(name));
    return Number(info.lastInsertRowid);
  };

  const trx = db.transaction((rowsIn: typeof rows) => {
    for (let i = 0; i < rowsIn.length; i++) {
      const raw = rowsIn[i] ?? {};
      const mapped: Record<string, unknown> = {};

      try {
        db.exec('SAVEPOINT one');

        const articleNumber = String(get(raw, mapping.articleNumber) ?? '').trim();
        if (!articleNumber) {
          result.errors.push({ row: i, reason: 'Pflichtfeld "Artikelnummer" fehlt', raw, mapped: {} });
          db.exec('RELEASE one');
          continue;
        }
        mapped.articleNumber = articleNumber;

        const name = get(raw, mapping.name) as string | null;
        const ean = get(raw, mapping.ean) as string | null;
        const unit = get(raw, mapping.unit) as string | null;
        const productGroup = get(raw, mapping.productGroup) as string | null;
        const price = toPrice(get(raw, mapping.price) as string | number | null);
        const categoryName = get(raw, mapping.categoryName) as string | null;

        if (name !== null) mapped.name = name;
        if (ean !== null) mapped.ean = ean;
        if (unit !== null) mapped.unit = unit;
        if (productGroup !== null) mapped.productGroup = productGroup;
        if (price !== null) mapped.price = price;

        const category_id = categoryName !== null ? ensureCategoryId(categoryName) : null;
        if (categoryName !== null) mapped.category_id = category_id;

        const existing = selectArticleId.get(articleNumber) as { id: number } | undefined;

        if (existing) {
          const updatable = ['name', 'price', 'unit', 'ean', 'productGroup', 'category_id'].filter((k) => k in mapped);

          if (updatable.length === 0) {
            result.skipped++;
            db.exec('RELEASE one');
            continue;
          }

          const stmt = updateArticleStmtFactory(updatable);
          if (!opts.dryRun) stmt.run({ articleNumber, ...mapped });
          result.updated++;
          db.exec('RELEASE one');
          continue;
        }

        if (!name || String(name).trim() === '') {
          result.errors.push({
            row: i,
            reason: 'Neu anlegen nicht möglich: "Name" fehlt (Pflichtfeld für INSERT).',
            raw,
            mapped: { articleNumber, ...mapped },
          });
          db.exec('RELEASE one');
          continue;
        }

        const insertPayload = {
          articleNumber,
          name: String(name),
          price: price ?? 0,
          unit: unit ?? null,
          ean: ean ?? null,
          productGroup: productGroup ?? null,
          category_id: category_id ?? null,
        };

        if (!opts.dryRun) insertArticleStmtBase.run(insertPayload);
        result.inserted++;
        db.exec('RELEASE one');
      } catch (e: any) {
        db.exec('ROLLBACK TO one');
        result.errors.push({
          row: i,
          reason: e?.message || 'Unbekannter Fehler (SQL)',
          raw,
          mapped,
        });
        db.exec('RELEASE one');
      }
    }
  });

  trx(rows);

  result.ok = result.inserted + result.updated;

  if (result.errors.length > 0) {
    const records = result.errors.map((e) => ({
      row: e.row,
      reason: e.reason,
      articleNumber: (e.mapped?.articleNumber as string) ?? '',
      mappedJson: JSON.stringify(e.mapped ?? {}),
      rawJson: JSON.stringify(e.raw ?? {}),
    }));
    const header = 'row;reason;articleNumber;mappedJson;rawJson';
    const body = records
      .map((r) =>
        [r.row, r.reason, r.articleNumber, r.mappedJson, r.rawJson]
          .map((s) => `"${String(s).replace(/"/g, '""')}"`)
          .join(';'),
      )
      .join('\n');
    result.errorCsv = `${header}\n${body}`;
  }

  return result;
}
