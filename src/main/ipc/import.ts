import { ipcMain } from 'electron';
import { IPC_CHANNELS, ok, err } from '../../shared/ipc';
import { importArticles } from '../services/articlesImportService';

export function registerImportHandlers() {
  ipcMain.handle(IPC_CHANNELS.import.run, (event, payload) => {
    try {
      const summary = importArticles({
        rows: payload.rows,
        dryRun: payload.dryRun,
        onProgress: (p) => event.sender.send(IPC_CHANNELS.import.progress, p),
      });
      return ok(summary);
    } catch (e: any) {
      return err('IMPORT_FAILED', e.message);
    }
  });
}
