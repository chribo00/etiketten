import { ipcMain } from 'electron';
import path from 'path';
import { importDatanorm } from '../datanorm/parser';
import { searchArticles } from '../db';
import { registerCartHandlers } from './cart';
import { registerLabelsHandlers } from './labels';
import { registerShellHandlers } from './shell';

export function registerIpcHandlers() {
  registerCartHandlers();
  registerLabelsHandlers();
  registerShellHandlers();

  type DatanormImportPayload = {
    filePath: string; // absoluter Pfad zur DATANORM.001
    name?: string; // optional; default = basename(filePath)
    mapping?: {
      articleNumber?: boolean;
      ean?: boolean;
      shortText?: boolean;
      price?: boolean;
      image?: boolean;
    };
  };

  ipcMain.handle('datanorm:import', async (evt, raw: DatanormImportPayload) => {
    if (!raw || !raw.filePath) {
      throw new RangeError('Missing required parameter "filePath"');
    }
    const filePath = raw.filePath;
    const safeName = (raw.name && raw.name.trim()) || path.basename(filePath);
    const mapping = raw.mapping ?? {};
    try {
      const imported = await importDatanorm(filePath, evt.sender);
      return { imported, name: safeName, path: filePath, mapping };
    } catch (err: any) {
      const count = err?.imported ?? 0;
      const first = err?.item ?? err?.items?.[0];
      console.error('import failed after', count, 'items');
      if (first) console.error('first failed item', first);
      throw err;
    }
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
