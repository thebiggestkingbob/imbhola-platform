import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { hashPassword, requireRole, type Actor } from './auth.ts';
import { audit, now, transaction } from './db.ts';

export function register(db: DatabaseSync, name: string, email: string, password: string, kind = 'employer') {
  if (!['employer','sdf'].includes(kind)) throw new Error('Choose an employer or SDF account.');
  const normalized = email.trim().toLowerCase();
  if (!name.trim() || name.length > 100 || !/^[a-z0-9._+-]{1,100}@imbhola\.test$/.test(normalized)) {
    throw new Error('Enter a name and a synthetic @imbhola.test email address.');
  }
  if (password.length < 12 || password.length > 256) throw new Error('Use a password between 12 and 256 characters.');
  transaction(db, () => {
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(normalized)) return;
    const id = randomUUID();
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,NULL)')
      .run(id,normalized,name.trim(),hashPassword(password),kind);
    audit(db,null,id,'account.requested',id);
  });
}

export function requireOperations(actor: Actor) {
  if (actor.kind !== 'operations') throw new Error('Operations access is required.');
}

export function verifyAccount(db: DatabaseSync, actor: Actor, id: string) {
  requireOperations(actor);
  transaction(db, () => {
    const change = db.prepare('UPDATE users SET verified_at=? WHERE id=? AND verified_at IS NULL')
      .run(now(),id);
    if (change.changes) audit(db,null,actor.id,'account.local_verified',id);
  });
}

export function createCompany(db: DatabaseSync, actor: Actor, name: string) {
  if (actor.kind !== 'employer' || !name.trim() || name.length > 120) throw new Error('Enter a valid company name.');
  return transaction(db, () => {
    const id = randomUUID();
    db.prepare('INSERT INTO tenants(id,name) VALUES(?,?)').run(id,name.trim());
    db.prepare("INSERT INTO membership VALUES(?,?,'owner',NULL)").run(id,actor.id);
    audit(db,id,actor.id,'company.created',id);
    return id;
  });
}

export function updateCompany(db: DatabaseSync, actor: Actor, tenant: string, sdl: string, seta: string, parent: string) {
  transaction(db, () => {
    requireRole(db,actor,tenant,['owner']);
    if (!sdl.trim() || sdl.length > 60 || !seta.trim() || seta.length > 100) throw new Error('Enter an SDL reference and a SETA.');
    if (parent) {
      requireRole(db,actor,parent,['owner']);
      const cycle = db.prepare(`WITH RECURSIVE ancestry(id) AS (
        SELECT ? UNION SELECT t.parent_id FROM tenants t JOIN ancestry a ON t.id=a.id WHERE t.parent_id IS NOT NULL
      ) SELECT 1 FROM ancestry WHERE id=?`).get(parent,tenant);
      if (cycle) throw new Error('A company cannot be its own ancestor.');
    }
    db.prepare('UPDATE tenants SET sdl=?,seta=?,parent_id=? WHERE id=?').run(sdl.trim(),seta.trim(),parent || null,tenant);
    audit(db,tenant,actor.id,'company.profile_updated',tenant);
  });
}

export function setMembership(db: DatabaseSync, actor: Actor, tenant: string, email: string, role: string, expiry: string) {
  transaction(db, () => {
    requireRole(db,actor,tenant,['owner']);
    const user = db.prepare('SELECT id,kind FROM users WHERE email=? AND verified_at IS NOT NULL')
      .get(email.trim().toLowerCase()) as {id: string; kind: string} | undefined;
    if (!user || user.kind === 'operations') throw new Error('Choose a verified local team member or SDF.');
    const existing = db.prepare('SELECT role FROM membership WHERE tenant=? AND user_id=?').get(tenant,user.id);
    if (existing?.role === 'owner') throw new Error('The owner’s membership cannot be reassigned.');
    if (role === 'revoke') {
      db.prepare('DELETE FROM membership WHERE tenant=? AND user_id=?').run(tenant,user.id);
      db.prepare('DELETE FROM invitations WHERE tenant=? AND user_id=?').run(tenant,user.id);
    } else {
      if (user.kind === 'sdf' ? role !== 'sdf' : !['hr','training','finance','committee','signatory'].includes(role)) {
        throw new Error('Choose a role for this type of account.');
      }
      let expires: string | null = null;
      if (role === 'sdf') {
        const end = new Date(expiry + 'T23:59:59+02:00');
        if (!/^20\d\d-\d\d-\d\d$/.test(expiry) || !Number.isFinite(+end) ||
          end.toISOString().slice(0,10) !== expiry || +end <= Date.now()) {
          throw new Error('Choose a future appointment expiry date.');
        }
        expires = end.toISOString();
      }
      if (role === 'sdf' || existing) {
        db.prepare(`INSERT INTO membership VALUES(?,?,?,?) ON CONFLICT(tenant,user_id)
          DO UPDATE SET role=excluded.role, expires=excluded.expires`).run(tenant,user.id,role,expires);
      } else {
        db.prepare(`INSERT INTO invitations VALUES(?,?,?,?) ON CONFLICT(tenant,user_id)
          DO UPDATE SET role=excluded.role, expires=excluded.expires`)
          .run(tenant,user.id,role,new Date(Date.now() + 7 * 86400_000).toISOString());
      }
    }
    audit(db,tenant,actor.id,'membership.' + role,user.id);
  });
}

export function saveCommercial(db: DatabaseSync, actor: Actor, tenant: string, type: string, name: string,
  amount: string, status: string, reference: string, id: string) {
  requireOperations(actor);
  const states: Record<string, string[]> = {
    subscription: ['draft','active','suspended','ended'],
    'managed contract': ['draft','active','suspended','ended'],
    invoice: ['draft','issued','paid','void'],
  };
  if (!Object.hasOwn(states,type) || !states[type].includes(status) || !name.trim() || name.length > 120 ||
    !reference.trim() || reference.length > 100 || !/^\d{1,10}(\.\d{1,2})?$/.test(amount)) {
    throw new Error('Provide a valid commercial record, amount, status and reference.');
  }
  transaction(db, () => {
    const cents = Math.round(Number(amount) * 100);
    const key = id || randomUUID();
    if (id) {
      const result = db.prepare('UPDATE commercial SET name=?,cents=?,status=?,reference=? WHERE tenant=? AND id=? AND type=?')
        .run(name.trim(),cents,status,reference.trim(),tenant,id,type);
      if (!result.changes) throw new Error('Commercial record not found for this company.');
    } else {
      db.prepare('INSERT INTO commercial VALUES(?,?,?,?,?,?,?)').run(tenant,key,type,name.trim(),cents,status,reference.trim());
    }
    audit(db,tenant,actor.id,'commercial.saved',key);
  });
}

export function captureLead(db: DatabaseSync, name: string, email: string, company: string, purpose: string, consent: boolean) {
  if (!consent || !name.trim() || !company.trim() || name.length > 100 || company.length > 120 ||
    !/^[a-z0-9._+-]{1,100}@imbhola\.test$/i.test(email) || !['enquiry','demo'].includes(purpose)) {
    throw new Error('Use a synthetic @imbhola.test address and confirm consent.');
  }
  const id = randomUUID();
  db.prepare('INSERT INTO leads VALUES(?,?,?,?,?,?,?)')
    .run(id,name.trim(),email.toLowerCase(),company.trim(),purpose,'local-notice-v1',now());
}

export function acceptInvitation(db: DatabaseSync, actor: Actor, tenant: string) {
  transaction(db, () => {
    const invitation = db.prepare('SELECT role FROM invitations WHERE tenant=? AND user_id=? AND expires>?')
      .get(tenant,actor.id,now());
    if (!invitation) throw new Error('This invitation is unavailable or expired.');
    db.prepare('INSERT INTO membership VALUES(?,?,?,NULL)').run(tenant,actor.id,invitation.role);
    db.prepare('DELETE FROM invitations WHERE tenant=? AND user_id=?').run(tenant,actor.id);
    audit(db,tenant,actor.id,'membership.accepted',actor.id);
  });
}

export function createSupportRequest(db: DatabaseSync, actor: Actor, tenant: string, title: string, detail: string) {
  transaction(db, () => {
    requireRole(db,actor,tenant,['owner','sdf']);
    if (!title.trim() || !detail.trim() || title.length > 120 || detail.length > 500) {
      throw new Error('Enter a subject and description for the request.');
    }
    const id = randomUUID();
    db.prepare("INSERT INTO support VALUES(?,?,?,?,'open',?)").run(tenant,id,title.trim(),detail.trim(),now());
    audit(db,tenant,actor.id,'support.opened',id);
  });
}

export function resolveSupportRequest(db: DatabaseSync, actor: Actor, id: string) {
  requireOperations(actor);
  transaction(db, () => {
    const request = db.prepare("SELECT tenant FROM support WHERE id=? AND status='open'").get(id);
    if (!request) throw new Error('This support request is unavailable.');
    db.prepare("UPDATE support SET status='resolved' WHERE id=?").run(id);
    audit(db,String(request.tenant),actor.id,'support.resolved',id);
  });
}
