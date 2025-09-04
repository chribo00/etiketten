import type { IpcResponse } from '../src/shared/ipc';
import { IPC_CHANNELS } from '../src/shared/ipc';
import { registerIpcHandlers } from '../src/main/ipc/index';

const handlers: Record<string, any> = {};
jest.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, fn: any) => {
      handlers[channel] = fn;
    },
  },
  BrowserWindow: {
    getFocusedWindow: () => ({ webContents: { openDevTools: jest.fn() } }),
  },
}));

jest.mock('../src/main/db', () => ({
  getDbInfo: () => ({ path: '/tmp/test.db', rowCount: 5 }),
  listCategories: () => [{ id: 1, name: 'Test' }],
  clearArticles: () => 0,
  createCategory: jest.fn(),
  renameCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

describe('IPC handlers', () => {
  beforeAll(() => {
    registerIpcHandlers();
  });

  test('db:info returns response schema', async () => {
    const res: IpcResponse<any> = await handlers[IPC_CHANNELS.db.info]({});
    expect(res).toEqual({ ok: true, data: { path: '/tmp/test.db', rowCount: 5 } });
  });

  test('categories:list returns response schema', async () => {
    const res: IpcResponse<any> = await handlers[IPC_CHANNELS.categories.list]({});
    expect(res).toEqual({ ok: true, data: [{ id: 1, name: 'Test' }] });
  });
});
