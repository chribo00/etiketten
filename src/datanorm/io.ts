import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';

export interface InputFile {
  name: string; // original file name
  path: string; // absolute path
}

/**
 * Resolve DATANORM files from a directory or a ZIP archive. All relevant
 * files are returned in the order they should be processed.
 */
export async function resolveInputFiles(input: string): Promise<InputFile[]> {
  const stat = fs.statSync(input);
  let dir = input;
  if (stat.isFile()) {
    // assume zip
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'datanorm-'));
    const zip = new AdmZip(input);
    zip.extractAllTo(tmp, true);
    dir = tmp;
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^DAT(A|P)\w+/.test(f))
    .map((f) => ({ name: f, path: path.join(dir, f) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return files;
}
