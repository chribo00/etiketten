// scripts/build-preload.mjs
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await build({
  entryPoints: ["src/preload.ts"],           // deine TS-Quelle
  outfile: "build/preload.js",               // eine (!) gebündelte Datei
  bundle: true,
  platform: "node",
  format: "cjs",
  target: ["node18"],                        // Electron >= 28 nutzt Node 18
  sourcemap: true,
  external: [                                // native/electron-Module nicht bundlen
    "electron", "better-sqlite3", "fs", "path", "os", "node:fs", "node:path"
  ],
});
console.log("[build-preload] OK -> build/preload.js");
