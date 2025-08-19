import { BrowserWindow } from 'electron';
import { registerDatanormHandlers } from './datanorm';
import { registerArticlesHandlers } from './articles';
import { registerCartHandlers } from './cart';
import { registerLabelsHandlers } from './labels';
import { registerDialogHandlers } from './dialog';
import { registerShellHandlers } from './shell';

export function registerIpcHandlers(win: BrowserWindow) {
  registerDatanormHandlers(win);
  registerArticlesHandlers();
  registerCartHandlers();
  registerLabelsHandlers();
  registerDialogHandlers(win);
  registerShellHandlers();
}
