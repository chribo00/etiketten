declare module 'electron-store' {
  export default class Store<T = any> {
    constructor(options?: any);
    get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K];
    set(object: T): void;
    set<K extends keyof T>(key: K, value: T[K]): void;
    clear(): void;
    readonly store: T;
  }
}
