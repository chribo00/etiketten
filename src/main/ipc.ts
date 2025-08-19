import { ipcMain } from 'electron';
import { insertArticles, searchArticles, addToCart, getCart, updateCartQty, clearCart } from './database';
import { parseDatanorm } from './datanorm';
import { generateLabels } from './printing/labelGenerator';

ipcMain.handle('datanorm:import', async (_e, paths: string[]) => {
  const articles = await parseDatanorm(paths);
  insertArticles(articles);
  return { imported: articles.length, skipped: 0 };
});

ipcMain.handle('articles:search', (_e, q: string, limit: number, offset: number) => {
  return searchArticles(q, limit, offset);
});

ipcMain.handle('cart:add', (_e, articleId: string, qty: number) => {
  return addToCart(articleId, qty);
});

ipcMain.handle('cart:list', () => getCart());
ipcMain.handle('cart:updateQty', (_e, id: string, qty: number) => updateCartQty(id, qty));
ipcMain.handle('cart:clear', () => clearCart());

ipcMain.handle('labels:generate', (_e, options) => generateLabels(options));
