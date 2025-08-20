declare global {
  interface Window {
    bridge?: {
      ready: boolean;
      dialog?: { openDatanorm: () => Promise<void> };
      importDatanorm?: (opts: { fileBuffer?: ArrayBuffer }) => Promise<{ imported: number }>;
      onImportProgress?: (
        cb: (p: { phase: string; current: number; total?: number }) => void,
      ) => () => void;
      [key: string]: any;
    };
  }
}
export {};
