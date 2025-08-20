import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/index';

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Etiketten',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.resolve(__dirname, '../../build/preload.js'),
    },
  });

  if (!app.isPackaged) {
    await win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
