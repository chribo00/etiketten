import { BrowserWindow, dialog, ipcMain } from 'electron';

type PrintPayload = {
  jobName: string;
  html: string;
  pageSize: 'A4' | 'Letter';
  marginsMM: { top: number; right: number; bottom: number; left: number };
  saveDialog?: boolean;
  defaultPath?: string;
};

ipcMain.handle('print:labelsToPDF', async (_e, payload: PrintPayload) => {
  try {
    const { jobName, html, pageSize = 'A4', marginsMM, saveDialog = true, defaultPath } = payload;

    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        backgroundThrottling: false,
      },
    });

    const b64 = Buffer.from(html).toString('base64');
    await win.loadURL(`data:text/html;base64,${b64}`);
    await new Promise<void>((resolve) => {
      win.webContents.on('did-finish-load', () => resolve());
    });

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize,
      printBackground: true,
    } as any);

    if (saveDialog !== false) {
      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        title: jobName,
        defaultPath,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (!canceled && filePath) {
        const fs = await import('fs');
        fs.writeFileSync(filePath, pdfBuffer);
        win.destroy();
        return { ok: true, path: filePath };
      }
      win.destroy();
      return { ok: false, error: 'canceled' };
    }
    win.destroy();
    return { ok: true, dataBase64: pdfBuffer.toString('base64') };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) };
  }
});

