import { ipcMain, BrowserWindow } from 'electron';
import { importDatanorm } from '../datanorm/parser';
import { IPC_CHANNELS, ImportResultSchema } from '../../shared/ipc';
import { z } from 'zod';

export function registerDatanormHandlers(win: BrowserWindow) {
  ipcMain.handle(IPC_CHANNELS.datanorm.import, async (_e, path: unknown) => {
    const filePath = z.string().parse(path);
    const imported = await importDatanorm(filePath, win.webContents);
    return ImportResultSchema.parse({ imported });
  });
}
