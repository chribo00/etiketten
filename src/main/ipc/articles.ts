import { ipcMain } from 'electron';
import { searchArticles } from '../db';
import { IPC_CHANNELS, SearchPayloadSchema, SearchResultSchema } from '../../shared/ipc';

export function registerArticlesHandlers() {
  ipcMain.handle(IPC_CHANNELS.articles.search, (_e, payload) => {
    const { query, page, pageSize } = SearchPayloadSchema.parse(payload);
    const { items, total } = searchArticles({
      text: query,
      limit: pageSize,
      offset: page * pageSize,
    });
    return SearchResultSchema.parse({ items, total });
  });
}
