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
    };
  }
}
