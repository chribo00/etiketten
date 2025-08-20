import { ipcMain } from 'electron';
import path from 'path';
import { importDatanorm } from '../datanorm/parser';
import { registerArticlesHandlers } from './articles';
import { registerCartHandlers } from './cart';
import { registerLabelsHandlers } from './labels';
import { registerShellHandlers } from './shell';

export function registerIpcHandlers() {
  registerArticlesHandlers();
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
}
