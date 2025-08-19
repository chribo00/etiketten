import { ipcMain } from 'electron';
import { generateLabelsPdf } from '../labels/pdf';
import { IPC_CHANNELS, LabelsGenerateResultSchema } from '../../shared/ipc';
import { getCart } from '../db';

export function registerLabelsHandlers() {
  ipcMain.handle(IPC_CHANNELS.labels.generate, async () => {
    const cart = getCart().map((c: any) => ({ articleId: c.articleId, qty: c.qty, options: c.printOptions }));
    const result = await generateLabelsPdf(cart);
    return LabelsGenerateResultSchema.parse(result);
  });
}
