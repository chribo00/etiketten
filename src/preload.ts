import { contextBridge, ipcRenderer } from 'electron';

export type DatanormImportPayload = {
  filePath: string;
  name?: string;
  mapping?: {
    articleNumber?: boolean;
    ean?: boolean;
    shortText?: boolean;
    price?: boolean;
    image?: boolean;
    unit?: boolean;
    productGroup?: boolean;
  };
};

const bridge = {
  ready: true,
  pickDatanormFile: () => ipcRenderer.invoke('dialog:pick-datanorm'),
  importDatanorm: (payload: DatanormImportPayload) =>
    ipcRenderer.invoke('datanorm:import', payload),
  searchArticles: (opts: any) => ipcRenderer.invoke('articles:search', opts),
  dbInfo: () => ipcRenderer.invoke('db:info'),
  dbClear: () => ipcRenderer.invoke('db:clear'),
};

try {
  contextBridge.exposeInMainWorld('bridge', bridge);
} catch (err) {
  console.warn('exposeInMainWorld failed', err);
}

export type Bridge = typeof bridge;
