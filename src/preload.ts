import { contextBridge, ipcRenderer } from 'electron';

const api = {
  dialog: {
    openDatanorm: async (): Promise<void> => {
      try {
        await ipcRenderer.invoke('datanorm:openDialog');
      } catch (err) {
        console.error('openDatanorm failed', err);
        throw err;
      }
    },
  },
  importDatanorm: async (opts: { useDialog?: boolean; fileBuffer?: ArrayBuffer }): Promise<{ imported: number }> => {
    try {
      if (opts?.useDialog) {
        await ipcRenderer.invoke('datanorm:openDialog');
        return await ipcRenderer.invoke('datanorm:import', { useDialog: true });
      }
      return await ipcRenderer.invoke('datanorm:import', opts);
    } catch (err) {
      console.error('importDatanorm failed', err);
      throw err;
    }
  },
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

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
