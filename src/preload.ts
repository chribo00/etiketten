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
    update: (id: number, name: string) => ipcRenderer.invoke('categories:update', { id, name }),
    delete: (id: number, mode: 'reassign' | 'deleteArticles', reassignToId?: number | null) =>
      ipcRenderer.invoke('categories:delete', { id, mode, reassignToId }),
  },
  media: {
    addPrimary: (articleId: number, filePath: string, alt?: string) =>
      ipcRenderer.invoke('media:addPrimary', { articleId, filePath, alt }),
    list: (articleId: number) => ipcRenderer.invoke('media:list', { articleId }),
    remove: (mediaId: number) => ipcRenderer.invoke('media:remove', { mediaId }),
  },
  dbInfo: () => ipcRenderer.invoke('db:info'),
  dbClear: () => ipcRenderer.invoke('db:clear'),
};

try {
  contextBridge.exposeInMainWorld('bridge', bridge);
} catch (err) {
  console.warn('exposeInMainWorld failed', err);
}

const api = {
  settings: {
    get: (key?: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke('settings:set', { key, value }),
    getAll: () => ipcRenderer.invoke('settings:get'),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },
  print: {
    labelsToPDF: (payload: {
      jobName: string;
      html: string;
      pageSize?: 'A4' | 'Letter';
      marginsMM: { top: number; right: number; bottom: number; left: number };
      saveDialog?: boolean;
      defaultPath?: string;
    }) => ipcRenderer.invoke('print:labelsToPDF', payload),
  },
  articles: {
    upsertMany: (items: any[]) => ipcRenderer.invoke('articles:upsertMany', items),
  },
};

try {
  contextBridge.exposeInMainWorld('api', api);
} catch (err) {
  console.warn('exposeInMainWorld api failed', err);
}

export type Bridge = typeof bridge;
