export const app = {
  getPath: () => process.env.TEST_DB_DIR || '/tmp',
};
export const ipcMain = {} as any;
export const dialog = {} as any;
