import { ipcMain, dialog, BrowserWindow } from 'electron';
import path from 'path';
import { importDatanormFile } from '../datanorm/parser';
import {
  searchArticles,
  getDbInfo,
  clearArticles,
  createCustomArticle,
  updateCustomArticle,
  deleteCustomArticle,
  searchAllArticles,
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  db,
} from '../db';
import { IPC_CHANNELS, ok, err } from '../../shared/ipc';
import { registerCartHandlers } from './cart';
import { registerLabelsHandlers } from './labels';
import { registerShellHandlers } from './shell';
import { registerMediaHandlers } from './media';
import { registerArticlesHandlers } from './articles';
import { registerImportHandlers } from './import';

export function registerIpcHandlers() {
  registerCartHandlers();
  registerLabelsHandlers();
  registerShellHandlers();
  registerMediaHandlers();
  registerArticlesHandlers();
  registerImportHandlers();

  ipcMain.handle(IPC_CHANNELS.devtools.open, () => {
    BrowserWindow.getFocusedWindow()?.webContents.openDevTools({ mode: 'undocked' });
  });

  ipcMain.handle(IPC_CHANNELS.datanorm.import, async (_e, { filePath, mapping, categoryId }) => {
    const res = await importDatanormFile({ filePath, mapping, categoryId });
    console.log('Import result', res);
    return res;
  });

  ipcMain.handle('articles:search', async (_e, opts) => searchArticles(opts));
  ipcMain.handle('articles:searchAll', async (_e, opts) => searchAllArticles(opts));

  ipcMain.handle('custom:create', (_e, payload) => createCustomArticle(payload));
  ipcMain.handle('custom:update', (_e, { id, patch }) => updateCustomArticle(id, patch));
  ipcMain.handle('custom:delete', (_e, id) => deleteCustomArticle(id));

  ipcMain.handle(IPC_CHANNELS.categories.list, () => {
    try {
      return ok(listCategories());
    } catch (e: any) {
      return err('DB_ERROR', e.message);
    }
  });
  ipcMain.handle(IPC_CHANNELS.categories.create, (_e, name) => createCategory(name));
  ipcMain.handle(IPC_CHANNELS.categories.update, (_e, { id, name }) => renameCategory(id, name));
  ipcMain.handle(IPC_CHANNELS.categories.delete, (_e, payload) =>
    deleteCategory(payload.id, payload.mode, payload.reassignToId),
  );

  ipcMain.handle(IPC_CHANNELS.db.info, () => {
    try {
      return ok(getDbInfo());
    } catch (e: any) {
      return err('DB_ERROR', e.message);
    }
  });

  ipcMain.handle(IPC_CHANNELS.db.clear, () => {
    try {
      return ok(clearArticles());
    } catch (e: any) {
      return err('DB_ERROR', e.message);
    }
  });

  ipcMain.handle('dialog:pick-datanorm', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'DATANORM', extensions: ['001', 'txt', 'csv'] }],
    });
    if (canceled || !filePaths[0]) return null;
    return { filePath: filePaths[0], name: path.basename(filePaths[0]) };
  });
}
