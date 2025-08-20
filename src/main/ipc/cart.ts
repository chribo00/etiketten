import { ipcMain } from 'electron';
import { addToCart, clearCart, getCart, removeCartItem, updateCartItem } from '../db';
import { IPC_CHANNELS, CartAddSchema, CartUpdateSchema } from '../../shared/ipc';
import { z } from 'zod';

export function registerCartHandlers() {
  ipcMain.handle(IPC_CHANNELS.cart.get, () => getCart());

  ipcMain.handle(IPC_CHANNELS.cart.add, (_e, payload) => {
    const { articleId, qty, opts } = CartAddSchema.parse(payload);
    return addToCart(Number(articleId), qty, opts);
  });

  ipcMain.handle(IPC_CHANNELS.cart.update, (_e, payload) => {
    const { id, patch } = CartUpdateSchema.parse(payload);
    updateCartItem(id, { qty: patch.qty, opts: patch.opts });
  });

  ipcMain.handle(IPC_CHANNELS.cart.remove, (_e, id) => {
    removeCartItem(z.string().parse(id));
  });

  ipcMain.handle(IPC_CHANNELS.cart.clear, () => {
    clearCart();
  });
}
