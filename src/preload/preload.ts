import { contextBridge, ipcRenderer } from 'electron';

const api = {
  importDatanorm: (paths: string[]) => ipcRenderer.invoke('datanorm:import', paths),
  searchArticles: (q: string, limit: number, offset: number) => ipcRenderer.invoke('articles:search', q, limit, offset),
  cartAdd: (articleId: string, qty: number) => ipcRenderer.invoke('cart:add', articleId, qty),
  cartList: () => ipcRenderer.invoke('cart:list'),
  cartUpdateQty: (id: string, qty: number) => ipcRenderer.invoke('cart:updateQty', id, qty),
  cartClear: () => ipcRenderer.invoke('cart:clear'),
  generateLabels: (options: any) => ipcRenderer.invoke('labels:generate', options),
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
