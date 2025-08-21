#!/usr/bin/env node
import { importDatanorm } from '../datanorm';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  const input = getArg('input');
  if (!input) {
    console.error('usage: datanorm-import --input <path> [--supplier "Name"] [--version auto|v4|v5]');
    process.exit(1);
  }
  const supplier = getArg('supplier');
  const version = (getArg('version') as any) || 'auto';
  const dry = getArg('dry-run') === 'true';
  const result = await importDatanorm({ input, supplierName: supplier, version, dryRun: dry });
  console.log('Import finished', result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
