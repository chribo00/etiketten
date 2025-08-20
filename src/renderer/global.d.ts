declare global {
  interface Window {
    bridge?: {
      ready: boolean;
      pickDatanormFile?: () => Promise<{ filePath: string; name: string } | null>;
      importDatanorm?: (payload: {
        filePath: string;
        name?: string;
        mapping?: any;
      }) => Promise<{ parsed: number; inserted: number; updated: number; durationMs: number }>;
        searchArticles?: (opts: {
          text?: string;
          limit?: number;
          offset?: number;
          sortBy?: 'name' | 'articleNumber' | 'price';
          sortDir?: 'ASC' | 'DESC';
        }) => Promise<{ items: any[]; total: number; message?: string }>;
        searchAll?: (opts: {
          text?: string;
          limit?: number;
          offset?: number;
          sortBy?: 'name' | 'articleNumber' | 'price';
          sortDir?: 'ASC' | 'DESC';
        }) => Promise<{ items: { id?: number; articleNumber?: string; ean?: string; name: string; price?: number; unit?: string; productGroup?: string; source: 'import' | 'custom' }[]; total: number; message?: string }>;
        customCreate?: (a: any) => Promise<{ id: number }>;
        customUpdate?: (id: number, patch: any) => Promise<{ changes: number }>;
        customDelete?: (id: number) => Promise<{ changes: number }>;
      dbInfo?: () => Promise<{ path: string; rowCount: number }>;
      dbClear?: () => Promise<number>;
      [key: string]: any;
    };
  }
}
export {};
