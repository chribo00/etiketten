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
  };
};

const bridge = {
  ready: true,
  importDatanorm: (payload: DatanormImportPayload) =>
    ipcRenderer.invoke('datanorm:import', payload),
  searchArticles: (opts: any) => ipcRenderer.invoke('articles:search', opts),
  onImportProgress: (
    cb: (p: { phase: string; current: number; total?: number }) => void,
  ): (() => void) => {
    const handler = (_event: unknown, data: any) => {
      try {
        cb(data);
      } catch (err) {
        console.error('onImportProgress callback error', err);
      }
    };
    ipcRenderer.on('datanorm:progress', handler);
    return () => {
      try {
        ipcRenderer.removeListener('datanorm:progress', handler);
      } catch (err) {
        console.error('unsubscribe failed', err);
      }
    };
  },
};

try {
  contextBridge.exposeInMainWorld('bridge', bridge);
} catch (err) {
  console.warn('exposeInMainWorld failed', err);
}

export type Bridge = typeof bridge;
