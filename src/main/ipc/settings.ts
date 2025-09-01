import { ipcMain } from 'electron';
import { get, set, getAll, reset } from '../settings';

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', (_e, key?: string) => {
    if (key) {
      return get(key);
    }
    return getAll();
  });

  ipcMain.handle('settings:set', (_e, { key, value }: { key: string; value: unknown }) => {
    set(key, value);
  });

  ipcMain.handle('settings:reset', () => {
    reset();
  });
}

