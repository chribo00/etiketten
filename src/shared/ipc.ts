import { z } from 'zod';

export const IPC_CHANNELS = {
  datanorm: {
    import: 'ipc.datanorm.import',
    importProgress: 'ipc.datanorm.import:progress',
  },
  articles: {
    search: 'ipc.articles.search',
  },
  cart: {
    get: 'ipc.cart.get',
    add: 'ipc.cart.add',
    update: 'ipc.cart.update',
    remove: 'ipc.cart.remove',
    clear: 'ipc.cart.clear',
  },
  labels: {
    generate: 'ipc.labels.generate',
  },
  dialog: {
    open: 'ipc.dialog.open',
  },
  shell: {
    open: 'ipc.shell.open',
  },
} as const;

export const ImportResultSchema = z.object({ imported: z.number() });
export const ImportProgressSchema = z.object({ processed: z.number(), total: z.number().optional() });

export const SearchPayloadSchema = z.object({ query: z.string(), page: z.number().int().nonnegative(), pageSize: z.number().int().positive() });
export const SearchResultSchema = z.object({ items: z.array(z.any()), total: z.number() });

export const CartAddSchema = z.object({ articleId: z.string(), qty: z.number().positive().default(1), opts: z.any().optional() });
export const CartUpdateSchema = z.object({ id: z.string(), patch: z.object({ qty: z.number().positive().optional(), opts: z.any().optional() }) });
export const CartRemoveSchema = z.string();

export const LabelsGenerateResultSchema = z.object({ pdfPath: z.string() });

export const DialogOpenResultSchema = z.object({ filePaths: z.array(z.string()) });
