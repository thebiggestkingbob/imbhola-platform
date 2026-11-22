import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { now } from './db.ts';

export type Kind = 'employer' | 'sdf' | 'operations';
export type Role = 'owner' | 'hr' | 'training' | 'finance' | 'committee' | 'signatory' | 'sdf';
export type Actor = { id: string; email: string; name: string; kind: Kind };
export const cookieName = 'imbhola_local_session';

export function digest(value: string | Uint8Array) {
  return createHash('sha256').update(value).digest('hex');
}

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}

export function signIn(db: DatabaseSync, email: string, password: string) {
  if (email.length > 254 || password.length > 256) return;
  const user = db.prepare('SELECT id,password FROM users WHERE email=? AND verified_at IS NOT NULL')
    .get(email.trim().toLowerCase()) as { id: string; password: string } | undefined;
  const stored = user?.password ?? '00000000000000000000000000000000:' + '00'.repeat(64);
  const computed = hashPassword(password, stored.slice(0, 32));
  if (!user || !timingSafeEqual(Buffer.from(computed), Buffer.from(stored))) return;
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions VALUES(?,?,?)')
    .run(digest(token), user.id, new Date(Date.now() + 8 * 60 * 60_000).toISOString());
  return token;
}

export function sessionActor(db: DatabaseSync, token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
  return db.prepare(`SELECT u.id,u.email,u.name,u.kind FROM sessions s
    JOIN users u ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.verified_at IS NOT NULL`)
    .get(digest(token), now()) as Actor | undefined;
}

export function roleFor(db: DatabaseSync, actor: Actor, tenant: string) {
  const row = db.prepare('SELECT role FROM membership WHERE user_id=? AND tenant=? AND (expires IS NULL OR expires>?)')
    .get(actor.id, tenant, now()) as { role: Role } | undefined;
  return row?.role;
}

export function requireRole(db: DatabaseSync, actor: Actor, tenant: string, roles?: readonly Role[]) {
  const role = roleFor(db, actor, tenant);
  if (!role || (roles && !roles.includes(role))) throw new Error('You do not have access to this company action.');
  return role;
}
