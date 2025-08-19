import { ipcMain, shell } from 'electron';
import { importDatanorm } from './datanorm/parser';
import { searchArticles, addToCart, getCart, updateCartItem, removeCartItem, clearCart } from './db';
import { generateLabelsPdf } from './labels/pdf';
import { z } from 'zod';

export const PrintOptionsSchema = z.object({
  showArticleNumber: z.boolean().optional(),
  showEan: z.boolean().optional(),
  showShortText: z.boolean().optional(),
  showListPrice: z.boolean().optional(),
  showImage: z.boolean().optional(),
});

ipcMain.handle('datanorm:import', async (_e, p: string) => {
  return importDatanorm(z.string().parse(p));
});

ipcMain.handle('articles:search', (_e, payload) => {
  const { q, page, pageSize } = z
    .object({ q: z.string(), page: z.number().int().nonnegative(), pageSize: z.number().int().positive() })
    .parse(payload);
  return searchArticles(q, pageSize, page * pageSize);
});

ipcMain.handle('cart:get', () => getCart());

ipcMain.handle('cart:add', (_e, payload) => {
  const { articleId, qty, opts } = z
    .object({ articleId: z.string(), qty: z.number().positive().default(1), opts: PrintOptionsSchema.optional() })
    .parse(payload);
  return addToCart(articleId, qty, opts);
});

ipcMain.handle('cart:update', (_e, payload) => {
  const { id, patch } = z
    .object({
      id: z.string(),
      patch: z.object({ qty: z.number().positive().optional(), opts: PrintOptionsSchema.optional() }),
    })
    .parse(payload);
  updateCartItem(id, { qty: patch.qty, opts: patch.opts });
});

ipcMain.handle('cart:remove', (_e, id) => {
  removeCartItem(z.string().parse(id));
});

ipcMain.handle('cart:clear', () => clearCart());

ipcMain.handle('labels:generate', async (_e, items) => {
  const arr = z
    .array(z.object({ articleId: z.string(), qty: z.number().positive().default(1), options: PrintOptionsSchema }))
    .parse(items);
  return generateLabelsPdf(arr);
});

ipcMain.handle('shell:open', (_e, p) => shell.openPath(z.string().parse(p)));
