import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

function versionTag() {
  // z.B. "v20.17.0"
  return process.version.replace(/^v?/, 'v');
}

function headersRoot() {
  return path.join('C:\\', 'node-headers', versionTag());
}

function assertHeaders() {
  const include = path.join(headersRoot(), 'include', 'node', 'node_api.h');
  const lib = path.join(headersRoot(), 'Release', 'node.lib');
  const missing: string[] = [];
  if (!existsSync(include)) missing.push(include);
  if (!existsSync(lib)) missing.push(lib);
  if (missing.length) {
    console.error('Fehlende lokale Node-Header/Lib:\n - ' + missing.join('\n - '));
    process.exit(1);
  }
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const child = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (child.status !== 0) {
    process.exit(child.status ?? 1);
  }
}

function main() {
  const nodedir = headersRoot();
  assertHeaders();

  // 1) rebuild better-sqlite3 strikt gegen lokale Headers
  run('npm', ['rebuild', 'better-sqlite3', '--build-from-source', '--loglevel', 'verbose'], {
    npm_config_nodedir: nodedir,
    nodedir,
  });

  // 2) Jest starten (Args durchreichen)
  const args = process.argv.slice(2);
  run('node', [path.join('node_modules', 'jest', 'bin', 'jest.js'), ...args], {
    npm_config_nodedir: nodedir,
    nodedir,
  });
}

main();
