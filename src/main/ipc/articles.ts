import { ipcMain } from 'electron';
import { z } from 'zod';
import { searchArticles, upsertArticles, type ArticleRow } from '../db';
import { importArticles } from '../services/importArticles';
import { IPC_CHANNELS, SearchPayloadSchema, SearchResultSchema } from '../../shared/ipc';

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
      return upsertArticles(parsed);
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

  ipcMain.handle('articles:import', async (_evt, payload) => {
    return await importArticles(payload);
  });
}
