import Store from 'electron-store';
import type { LayoutSettings } from '../shared/layout';

export type SettingsSchema = LayoutSettings;

const defaults: SettingsSchema = {
  pageMargin: { top: 8, right: 8, bottom: 8, left: 8 },
  labelSize: { width: 70, height: 37 },
  spacing: { horizontal: 4, vertical: 8 },
  grid: { columns: 3, rows: 8 },
  barcodeHeightMM: 18,
};

let store: Store<SettingsSchema>;

function getStore() {
  if (!store) {
    store = new Store<SettingsSchema>({ name: 'settings', defaults });

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

