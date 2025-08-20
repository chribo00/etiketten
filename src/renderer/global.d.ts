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
      }) => Promise<{ ok: boolean; importedCount: number }>;
      onImportProgress?: (
        cb: (p: { phase: string; current: number; total?: number }) => void,
      ) => () => void;
      searchArticles?: (opts: {
        text?: string;
        limit?: number;
        offset?: number;
        sortBy?: 'name' | 'articleNumber' | 'price';
        sortDir?: 'ASC' | 'DESC';
      }) => Promise<{ items: any[]; total: number; message?: string }>;
      [key: string]: any;
    };
  }
}
export {};
