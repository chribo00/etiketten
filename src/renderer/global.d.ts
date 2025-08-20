declare global {
  interface Window {
    api?: {
      dialog: { openDatanorm: () => Promise<void> };
      importDatanorm: (opts: { useDialog?: boolean; fileBuffer?: ArrayBuffer }) => Promise<{ imported: number }>;
      onImportProgress: (cb: (p: { phase: string; current: number; total?: number }) => void) => () => void;
    };
  }
}
export {};
