import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import csp from './vite.csp';

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react(), csp()],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
