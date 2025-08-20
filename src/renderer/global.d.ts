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
      dbInfo?: () => Promise<{ path: string; rowCount: number }>;
      dbClear?: () => Promise<number>;
      [key: string]: any;
    };
  }
}
export {};
