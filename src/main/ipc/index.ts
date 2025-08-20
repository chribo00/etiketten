import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { importDatanorm } from '../datanorm/parser';
import { registerArticlesHandlers } from './articles';
import { registerCartHandlers } from './cart';
import { registerLabelsHandlers } from './labels';
import { registerShellHandlers } from './shell';

let lastSelectedPath: string | undefined;

export function registerIpcHandlers() {
  registerArticlesHandlers();
  registerCartHandlers();
  registerLabelsHandlers();
  registerShellHandlers();

  ipcMain.handle('datanorm:openDialog', async () => {
    try {
      const res = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'DATANORM 4/5', extensions: ['001', 'dat', 'txt'] }],
      });
      if (!res.canceled && res.filePaths.length > 0) {
        lastSelectedPath = res.filePaths[0];
      } else {
        lastSelectedPath = undefined;
      }
    } catch (err) {
      console.error('openDialog failed', err);
      throw err;
    }
  });

  ipcMain.handle(
    'datanorm:import',
    async (event, args: { useDialog?: boolean; fileBuffer?: ArrayBuffer }) => {
      try {
        let filePath: string | undefined;
        if (args?.useDialog) {
          filePath = lastSelectedPath;
        }
        if (args?.fileBuffer) {
          const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'datanorm-'));
          filePath = path.join(tmpDir, 'import.dat');
          await fs.writeFile(filePath, Buffer.from(args.fileBuffer));
        }
        if (!filePath) {
          throw new Error('No file selected');
        }
        const imported = await importDatanorm(filePath, event.sender);
        return { imported };
      } catch (err) {
        console.error('import failed', err);
        throw err;
      }
    },
  );
}
