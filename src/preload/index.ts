import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc';

const api = {
  async importDatanorm(openDialog: boolean = false, pathOverride?: string) {
    let path = pathOverride;
    if (!path && openDialog) {
      const res = await ipcRenderer.invoke(IPC_CHANNELS.dialog.open);
      path = res?.filePaths?.[0];
    }
    if (!path) return { imported: 0 };
    return ipcRenderer.invoke(IPC_CHANNELS.datanorm.import, path);
  },
  onImportProgress(cb: (p: { processed: number; total?: number }) => void) {
    const handler = (_e: unknown, data: any) => cb(data);
    ipcRenderer.on(IPC_CHANNELS.datanorm.importProgress, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.datanorm.importProgress, handler);
  },
  search(query: string, page: number, pageSize: number) {
    return ipcRenderer.invoke(IPC_CHANNELS.articles.search, { query, page, pageSize });
  },
  cart: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.cart.get),
    add: (input: any) => ipcRenderer.invoke(IPC_CHANNELS.cart.add, input),
    update: (input: any) => ipcRenderer.invoke(IPC_CHANNELS.cart.update, input),
    remove: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.cart.remove, id),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.cart.clear),
  },
  labels: {
    generate: () => ipcRenderer.invoke(IPC_CHANNELS.labels.generate),
  },
  dialog: {
    openDatanorm: () => ipcRenderer.invoke(IPC_CHANNELS.dialog.open),
  },
  shell: {
    open: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.shell.open, path),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
