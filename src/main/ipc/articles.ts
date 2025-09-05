import { ipcMain } from 'electron';
import { z } from 'zod';
import { searchArticles, upsertArticles, db, type ArticleRow, type ImportRow } from '../db';
import { IPC_CHANNELS, SearchPayloadSchema, SearchResultSchema } from '../../shared/ipc';
import { runImport } from '../importer';

export function registerArticlesHandlers() {
  ipcMain.handle(IPC_CHANNELS.articles.search, (_e, payload) => {
    const { query, page, pageSize } = SearchPayloadSchema.parse(payload);
    const { items, total } = searchArticles({
      text: query,
      limit: pageSize,
      offset: page * pageSize,
    });
    return SearchResultSchema.parse({ items, total });
  });

  const UpsertItem = z.object({
    articleNumber: z.string().min(1),
    ean: z.string().min(8).max(13).optional().nullable(),
    name: z.string().min(1),
    price: z.number().optional(),
    unit: z.string().optional().nullable(),
    productGroup: z.string().optional().nullable(),
    category_id: z.number().int().optional().nullable(),
  });
  const UpsertMany = z.array(UpsertItem);

  ipcMain.handle(IPC_CHANNELS.articles.upsertMany, (_e, items) => {
    try {
      const parsed = UpsertMany.parse(items) as ArticleRow[];
      const res = upsertArticles(parsed);
      const inserted = res.filter((r: any) => r.status === 'inserted').length;
      const updated = res.filter((r: any) => r.status === 'updated').length;
      return { ok: true, inserted, updated };
    } catch (err: any) {
      console.error('articles:upsertMany failed', err);
      if (err instanceof z.ZodError) {
        return { ok: false, error: { message: err.message, details: err.issues } };
      }
      return {
        ok: false,
        error: {
          message: err?.message || 'UPSERT failed',
          row: err?.row,
          articleNumber: err?.articleNumber,
        },
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.articles.import, async (_evt, payload: { rows: ImportRow[] }) => {
    try {
      const results = upsertArticles(payload.rows);
      const inserted = results.filter((r: any) => r.status === 'inserted').length;
      const updated = results.filter((r: any) => r.status === 'updated').length;
      const errors = results.filter((r: any) => r.status === 'error');
      return {
        ok: results.length - inserted - updated - errors.length,
        inserted,
        updated,
        skipped: 0,
        errors,
      };
    } catch (e: any) {
      return { ok: 0, inserted: 0, updated: 0, skipped: 0, errors: [{ row: -1, message: e?.message || String(e) }] };
    }
  });

  ipcMain.handle('import:run', async (_evt, { rows, mapping }) => {
    return runImport({ rows, mapping, db });
  });
}
