import path from "node:path";
import { app, BrowserWindow } from "electron";

app.setName('Etiketten');
app.setAppUserModelId('at.etu.etiketten');
const appData = app.getPath('appData');
app.setPath('userData', path.join(appData, 'Etiketten'));

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      title: 'Etiketten',
      show: false,
      webPreferences: {
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, "build", "preload.js"), // Dev: gebündelte Datei
      },
    });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDev = !app.isPackaged;
    const allowed =
      (isDev && url.startsWith('http://localhost:5173')) ||
      (!isDev && url.startsWith('file://'));
    if (!allowed) event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (app.isPackaged) {
    mainWindow.removeMenu();
    void mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  } else {
    void mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}

async function loadIpcModules() {
  const modules = ['./ipc/index', './ipc/settings', './ipc/print'];
  for (const m of modules) {
    try {
      const mod = await import(m);
      const resolved = (mod as any).default ?? mod;
      if (typeof resolved.registerIpcHandlers === 'function') resolved.registerIpcHandlers();
      if (typeof resolved.registerSettingsHandlers === 'function') resolved.registerSettingsHandlers();
      if (typeof resolved.registerPrintHandlers === 'function') resolved.registerPrintHandlers();
    } catch (err) {
      console.error('Failed to load IPC module', m, err);
    }
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await loadIpcModules();
    createMainWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

