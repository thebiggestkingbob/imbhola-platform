import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { localWorkspaceEnabled, reviewWorkspaceEnabled } from './mode.ts';

export function openDatabase(path: string) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
  db.exec(readFileSync(resolve('db/local.sql'), 'utf8'));
  return db;
}

let database: DatabaseSync | undefined;

export function localDb() {
  if (!localWorkspaceEnabled()) throw new Error('Local workspace is disabled.');
  if (!database) {
    mkdirSync('.imbhola-local', { recursive: true, mode: 0o700 });
    database = openDatabase(reviewWorkspaceEnabled() ? '.imbhola-local/review.sqlite' : '.imbhola-local/imbhola.sqlite');
  }
  return database;
}

export function transaction<T>(db: DatabaseSync, write: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = write();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function now() {
  return new Date().toISOString();
}

export function audit(db: DatabaseSync, tenant: string | null, userId: string | null, action: string, subject: string) {
  db.prepare('INSERT INTO audit(tenant,user_id,action,subject,created_at) VALUES(?,?,?,?,?)')
    .run(tenant, userId, action, subject, now());
}
