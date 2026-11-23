import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseSync } from 'node:sqlite';

const runtime = globalThis as typeof globalThis & {
  imbholaDemoScope?: AsyncLocalStorage<DatabaseSync>;
};

// Share the scope between the standalone server and the bundled Next.js routes.
export const demoScope = runtime.imbholaDemoScope ??= new AsyncLocalStorage<DatabaseSync>();
