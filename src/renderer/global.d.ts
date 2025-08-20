declare global {
  interface Window {
    bridge?: {
      ready: boolean;
      importDatanorm?: (payload: {
        filePath: string;
        name?: string;
        mapping?: {
          articleNumber?: boolean;
          ean?: boolean;
          shortText?: boolean;
          price?: boolean;
          image?: boolean;
        };
      }) => Promise<any>;
      onImportProgress?: (
        cb: (p: { phase: string; current: number; total?: number }) => void,
      ) => () => void;
      [key: string]: any;
    };
  }
}
export {};
