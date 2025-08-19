import { contextBridge, ipcRenderer } from 'electron';

const api = {
  importDatanorm: (path: string) => ipcRenderer.invoke('datanorm:import', path),
  search: (q: string, page: number, pageSize: number) => ipcRenderer.invoke('articles:search', { q, page, pageSize }),
  cart: {
    get: () => ipcRenderer.invoke('cart:get'),
    add: (articleId: string, qty: number, opts: any) => ipcRenderer.invoke('cart:add', { articleId, qty, opts }),
    update: (id: string, patch: any) => ipcRenderer.invoke('cart:update', { id, patch }),
    remove: (id: string) => ipcRenderer.invoke('cart:remove', id),
    clear: () => ipcRenderer.invoke('cart:clear')
  },
  labels: {
    generate: (items: any[]) => ipcRenderer.invoke('labels:generate', items)
  },
  openExternal: (path: string) => ipcRenderer.invoke('shell:open', path)
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
