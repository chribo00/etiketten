import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS, DialogOpenResultSchema } from '../../shared/ipc';

export function registerDialogHandlers(win: BrowserWindow) {
  ipcMain.handle(IPC_CHANNELS.dialog.open, async () => {
    const res = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Datanorm', extensions: ['txt', 'asc', 'zip'] }],
    });
    if (res.canceled) {
      return DialogOpenResultSchema.parse({ filePaths: [] });
    }
    return DialogOpenResultSchema.parse({ filePaths: res.filePaths });
  });
}
