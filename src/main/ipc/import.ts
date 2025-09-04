import { ipcMain } from 'electron';
import { IPC_CHANNELS, ok, err } from '../../shared/ipc';
import { importArticles } from '../services/articlesImportService';

export function registerImportHandlers() {
  let cancelled = false;

  ipcMain.handle(IPC_CHANNELS.import.run, (event, payload) => {
    cancelled = false;
    try {
      const summary = importArticles({
        rows: payload.rows,
        dryRun: payload.dryRun,
        onProgress: (p) => event.sender.send(IPC_CHANNELS.import.progress, p),
        shouldCancel: () => cancelled,
      });
      return ok({ ...summary, cancelled });
    } catch (e: any) {
      return err('IMPORT_FAILED', e.message);
    }
  });

  ipcMain.handle(IPC_CHANNELS.import.cancel, () => {
    cancelled = true;
    return ok(true);
  });
}
