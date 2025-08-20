import { ipcMain } from 'electron';
import { parseDatanorm } from '../datanorm/parser';
import { searchArticles, upsertArticles } from '../db';
import { registerCartHandlers } from './cart';
import { registerLabelsHandlers } from './labels';
import { registerShellHandlers } from './shell';

export function registerIpcHandlers() {
  registerCartHandlers();
  registerLabelsHandlers();
  registerShellHandlers();

  ipcMain.handle('datanorm:import', async (_evt, payload: { filePath: string }) => {
    if (!payload?.filePath) {
      throw new RangeError('Missing required parameter "filePath"');
    }
    const start = Date.now();
    const articles = parseDatanorm(payload.filePath);
    upsertArticles(articles);
    const duration = Date.now() - start;
    console.log(`Imported ${articles.length} articles in ${duration}ms`);
    return { ok: true, importedCount: articles.length };
  });

  ipcMain.handle('articles:search', async (_evt, opts) => {
    try {
      const limit = Math.max(1, Math.min(200, Number(opts?.limit ?? 50)));
      const offset = Math.max(0, Number(opts?.offset ?? 0));
      const sortBy = ['name', 'articleNumber', 'price'].includes(opts?.sortBy)
        ? opts.sortBy
        : 'name';
      const sortDir = opts?.sortDir === 'DESC' ? 'DESC' : 'ASC';
      return searchArticles({
        text: opts?.text,
        limit,
        offset,
        sortBy,
        sortDir,
      });
    } catch (err: any) {
      console.error('articles:search failed', err);
      return { items: [], total: 0, message: err?.message || 'Unbekannter Fehler' };
    }
  });
}
