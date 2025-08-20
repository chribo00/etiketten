import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipc/index.js';
import db from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Etiketten',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServer = process.env.VITE_DEV_SERVER_URL;
  if (devServer) {
    await win.loadURL(devServer);
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  registerIpcHandlers(win, db);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
