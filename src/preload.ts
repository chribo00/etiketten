import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, IpcResponse } from './shared/ipc';

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
    ipcRenderer.invoke(IPC_CHANNELS.datanorm.import, payload),
  searchArticles: (opts: any) => ipcRenderer.invoke(IPC_CHANNELS.articles.search, opts),
  searchAll: (opts: any) => ipcRenderer.invoke('articles:searchAll', opts),
  customCreate: (a: any) => ipcRenderer.invoke('custom:create', a),
  customUpdate: (id: number, patch: any) =>
    ipcRenderer.invoke('custom:update', { id, patch }),
  customDelete: (id: number) => ipcRenderer.invoke('custom:delete', id),
  categories: {
    list: (): Promise<IpcResponse<{ id: number; name: string }[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.categories.list),
    create: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.categories.create, name),
    update: (id: number, name: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.categories.update, { id, name }),
    delete: (
      id: number,
      mode: 'reassign' | 'deleteArticles',
      reassignToId?: number | null,
    ) => ipcRenderer.invoke(IPC_CHANNELS.categories.delete, { id, mode, reassignToId }),
  },
  media: {
    addPrimary: (articleId: number, filePath: string, alt?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.media.addPrimary, { articleId, filePath, alt }),
    list: (articleId: number) => ipcRenderer.invoke(IPC_CHANNELS.media.list, { articleId }),
    remove: (mediaId: number) => ipcRenderer.invoke(IPC_CHANNELS.media.remove, { mediaId }),
  },
  dbInfo: (): Promise<IpcResponse<{ path: string; rowCount: number }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.db.info),
  dbClear: (): Promise<IpcResponse<number>> => ipcRenderer.invoke(IPC_CHANNELS.db.clear),
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
    upsertMany: (items: any[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.articles.upsertMany, items) as Promise<
        | { ok: true; inserted: number; updated: number }
        | { ok: false; code?: string; message: string; details?: any }
      >,
    import: (payload: { rows: any[] }) =>
      ipcRenderer.invoke(IPC_CHANNELS.articles.import, payload),
  },
  import: {
    run: (payload: { rows: any[]; dryRun?: boolean }) =>
      ipcRenderer.invoke(IPC_CHANNELS.import.run, payload),
    onProgress: (handler: (p: { processed: number; total: number }) => void) => {
      const listener = (_e: any, data: any) => handler(data);
      ipcRenderer.on(IPC_CHANNELS.import.progress, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.import.progress, listener);
    },
    cancel: () => ipcRenderer.invoke(IPC_CHANNELS.import.cancel),
  },
  openDevTools: () => ipcRenderer.invoke(IPC_CHANNELS.devtools.open),
};

try {
  contextBridge.exposeInMainWorld('api', api);
} catch (err) {
  console.warn('exposeInMainWorld api failed', err);
}

export type Bridge = typeof bridge;
export type Api = typeof api;
