declare global {
  interface Window {
    bridge?: {
      ready: boolean;
      pickDatanormFile?: () => Promise<{ filePath: string; name: string } | null>;
      importDatanorm?: (payload: {
        filePath: string;
        name?: string;
        mapping?: any;
        categoryId?: number;
      }) => Promise<{ parsed: number; inserted: number; updated: number; durationMs: number }>;
        searchArticles?: (opts: {
          text?: string;
          limit?: number;
          offset?: number;
          sortBy?: 'name' | 'articleNumber' | 'price';
          sortDir?: 'ASC' | 'DESC';
          categoryId?: number;
        }) => Promise<{ items: any[]; total: number; message?: string }>;
        searchAll?: (opts: {
          text?: string;
          limit?: number;
          offset?: number;
          sortBy?: 'name' | 'articleNumber' | 'price';
          sortDir?: 'ASC' | 'DESC';
          categoryId?: number;
        }) => Promise<{
          items: {
            id?: number;
            articleNumber?: string;
            ean?: string;
            name: string;
            price?: number;
            unit?: string;
            productGroup?: string;
            category_id?: number;
            source: 'import' | 'custom';
            imagePath?: string | null;
          }[];
          total: number;
          message?: string;
        }>;
        customCreate?: (a: any) => Promise<{ id: number }>;
        customUpdate?: (id: number, patch: any) => Promise<{ changes: number }>;
        customDelete?: (id: number) => Promise<{ changes: number }>;
        categories?: {
          list: () => Promise<{ id: number; name: string }[]>;
          create: (name: string) => Promise<{ id: number }>;
          update: (id: number, name: string) => Promise<{ changes?: number; error?: string }>;
          delete: (
            id: number,
            mode: 'reassign' | 'deleteArticles',
            reassignToId?: number | null,
          ) => Promise<{ deleted?: boolean; error?: string }>;
        };
        media?: {
          addPrimary: (articleId: number, filePath: string, alt?: string) => Promise<any>;
          list: (articleId: number) => Promise<any[]>;
          remove: (mediaId: number) => Promise<any>;
        };
      dbInfo?: () => Promise<{ path: string; rowCount: number }>;
      dbClear?: () => Promise<number>;
      [key: string]: any;
    };
  }
}
export {};
