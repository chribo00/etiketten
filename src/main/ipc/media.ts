import { ipcMain } from 'electron';
import { z } from 'zod';
import { addPrimaryMedia, listMedia, removeMedia } from '../db';
import { IPC_CHANNELS } from '../../shared/ipc';

export function registerMediaHandlers() {
  ipcMain.handle(IPC_CHANNELS.media.addPrimary, async (_e, payload) => {
    const data = z
      .object({ articleId: z.number(), filePath: z.string(), alt: z.string().optional() })
      .parse(payload);
    return addPrimaryMedia(data);
  });
  ipcMain.handle(IPC_CHANNELS.media.list, (_e, payload) => {
    const data = z.object({ articleId: z.number() }).parse(payload);
    return listMedia(data.articleId);
  });
  ipcMain.handle(IPC_CHANNELS.media.remove, (_e, payload) => {
    const data = z.object({ mediaId: z.number() }).parse(payload);
    return removeMedia(data.mediaId);
  });
}
