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
  categoryId?: number;
};

const bridge = {
  ready: true,
  pickDatanormFile: () => ipcRenderer.invoke('dialog:pick-datanorm'),
  importDatanorm: (payload: DatanormImportPayload) =>
    ipcRenderer.invoke('datanorm:import', payload),
  searchArticles: (opts: any) => ipcRenderer.invoke('articles:search', opts),
  searchAll: (opts: any) => ipcRenderer.invoke('articles:searchAll', opts),
  customCreate: (a: any) => ipcRenderer.invoke('custom:create', a),
  customUpdate: (id: number, patch: any) =>
    ipcRenderer.invoke('custom:update', { id, patch }),
  customDelete: (id: number) => ipcRenderer.invoke('custom:delete', id),
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (name: string) => ipcRenderer.invoke('categories:create', name),
  },
  dbInfo: () => ipcRenderer.invoke('db:info'),
  dbClear: () => ipcRenderer.invoke('db:clear'),
};

try {
  contextBridge.exposeInMainWorld('bridge', bridge);
} catch (err) {
  console.warn('exposeInMainWorld failed', err);
}

export type Bridge = typeof bridge;
