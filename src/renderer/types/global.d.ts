export {};

declare global {
  interface Window {
    api: {
      settings: {
        get: <T = unknown>(key?: string) => Promise<T | Record<string, unknown> | undefined>;
        set: (key: string, value: unknown) => Promise<void>;
        getAll: () => Promise<Record<string, unknown>>;
        reset: () => Promise<void>;
      };
      print: {
        labelsToPDF: (payload: {
          jobName: string;
          html: string;
          pageSize?: 'A4' | 'Letter';
          marginsMM: { top: number; right: number; bottom: number; left: number };
          saveDialog?: boolean;
          defaultPath?: string;
        }) => Promise<{ ok: boolean; path?: string; dataBase64?: string; error?: string }>;
      };
      articles: {
        upsertMany: (items: any[]) => Promise<any>;
        import: (payload: { rows: any[] }) => Promise<any>;
      };
      invoke: (channel: string, payload?: any) => Promise<any>;
    };
  }
}
