import { ipcMain, dialog } from 'electron';
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
} from '../db';
import { registerCartHandlers } from './cart';
import { registerLabelsHandlers } from './labels';
import { registerShellHandlers } from './shell';

export function registerIpcHandlers() {
  registerCartHandlers();
  registerLabelsHandlers();
  registerShellHandlers();

  ipcMain.handle('datanorm:import', async (_e, { filePath, mapping, categoryId }) => {
    const res = await importDatanormFile({ filePath, mapping, categoryId });
    console.log('Import result', res);
    return res;
  });

    ipcMain.handle('articles:search', async (_e, opts) => searchArticles(opts));
    ipcMain.handle('articles:searchAll', async (_e, opts) => searchAllArticles(opts));

    ipcMain.handle('custom:create', (_e, payload) => createCustomArticle(payload));
    ipcMain.handle('custom:update', (_e, { id, patch }) => updateCustomArticle(id, patch));
    ipcMain.handle('custom:delete', (_e, id) => deleteCustomArticle(id));

  ipcMain.handle('categories:list', () => listCategories());
  ipcMain.handle('categories:create', (_e, name) => createCategory(name));

  ipcMain.handle('db:info', () => getDbInfo());

  ipcMain.handle('db:clear', () => clearArticles());

  ipcMain.handle('dialog:pick-datanorm', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'DATANORM', extensions: ['001', 'txt', 'csv'] }],
    });
    if (canceled || !filePaths[0]) return null;
    return { filePath: filePaths[0], name: path.basename(filePaths[0]) };
  });
}
