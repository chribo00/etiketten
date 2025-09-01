import type ElectronStore from 'electron-store';

let ElectronStoreCtor: typeof ElectronStore;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ElectronStoreCtor = require('electron-store');
} catch {
  throw new Error(
    "electron-store nicht installiert – bitte 'npm i electron-store@^8' ausführen."
  );
}

export type SettingsSchema = {
  pageMargin: { top: number; right: number; bottom: number; left: number };
  labelSize: { width: number; height: number };
  spacing: { horizontal: number; vertical: number };
  columns: number;
  rows: number;
};

const defaults: SettingsSchema = {
  pageMargin: { top: 8, right: 8, bottom: 8, left: 8 },
  labelSize: { width: 70, height: 37 },
  spacing: { horizontal: 4, vertical: 8 },
  columns: 3,
  rows: 8,
};

let store: ElectronStore<SettingsSchema>;

function getStore() {
  if (!store) {
    store = new ElectronStoreCtor<SettingsSchema>({ name: 'settings', defaults });

    // Migration: ensure all default keys exist
    for (const [key, value] of Object.entries(defaults)) {
      const current = store.get(key as keyof SettingsSchema);
      if (current === undefined) {
        store.set(key as keyof SettingsSchema, value as any);
      }
    }
  }
  return store;
}

export function get<T = unknown>(key: string): T | undefined {
  return getStore().get(key as keyof SettingsSchema) as T | undefined;
}

export function set<T = unknown>(key: string, value: T): void {
  getStore().set(key as any, value as any);
}

export function getAll(): Record<string, unknown> {
  return { ...getStore().store } as Record<string, unknown>;
}

export function reset(): void {
  const s = getStore();
  s.clear();
  s.set(defaults);
}

export function createSettingsStore() {
  return getStore();
}

export const defaultSettings = defaults;

