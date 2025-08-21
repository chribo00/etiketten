import { Readable } from 'stream';
import iconv from 'iconv-lite';

/**
 * Wrap a readable stream and decode CP850 encoded bytes to UTF-8 strings.
 * Many DATANORM sources use CP850. This helper ensures we always work with
 * UTF-8 strings internally.
 */
export function decodeCp850(stream: Readable): Readable {
  const decoder = iconv.decodeStream('cp850');
  return stream.pipe(decoder);
}
