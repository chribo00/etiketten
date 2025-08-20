// dev-main.cjs – Bootstrap für Electron im DEV
process.env.TS_NODE_PROJECT = process.env.TS_NODE_PROJECT || 'tsconfig.main.json';
require('ts-node/register/transpile-only');
require('source-map-support/register');

// Jetzt das eigentliche Electron-Main laden (CJS require, ts-node hooked)
require('./src/main/main.ts');
