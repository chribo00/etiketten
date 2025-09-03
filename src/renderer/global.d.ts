import type { Bridge, Api } from '../preload';

declare global {
  interface Window {
    bridge?: Bridge;
    api?: Api;
  }
}

export {};
