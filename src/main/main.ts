import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { registerIpc } from './ipc';

const __dirname = dirname(fileURLToPath(import.meta.url));
const preloadPath = join(__dirname, 'preload.js');

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Etiketten',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: preloadPath,
    },
  });

  if (!app.isPackaged) {
    await win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    await win.loadFile(join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
