import { ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc';
import { z } from 'zod';

export function registerShellHandlers() {
  ipcMain.handle(IPC_CHANNELS.shell.open, (_e, p) => shell.openPath(z.string().parse(p)));
}
