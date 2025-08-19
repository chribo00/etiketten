import { ParsedArticle } from './types';
import { parseV4 } from './v4';
import { parseV5 } from './v5';

export async function parseDatanorm(paths: string[]): Promise<ParsedArticle[]> {
  const hasV5 = paths.some((p) => p.toLowerCase().includes('v5'));
  return hasV5 ? parseV5(paths) : parseV4(paths);
}
