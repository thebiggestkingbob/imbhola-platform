import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth.ts';
import { now, openDatabase, transaction } from './db.ts';

export function seed(db: DatabaseSync, password: string) {
  transaction(db, () => {
    db.prepare('INSERT OR IGNORE INTO tenants(id,name,seta,sdl) VALUES(?,?,?,?)')
      .run('atlas', 'Atlas Workshop (synthetic)', 'Services SETA', 'DEMO-ATLAS');
    db.prepare('INSERT OR IGNORE INTO tenants(id,name,seta,sdl) VALUES(?,?,?,?)')
      .run('beacon', 'Beacon Studio (synthetic)', 'Services SETA', 'DEMO-BEACON');

    const accounts = [
      ['owner', 'Employer owner', 'employer'], ['hr', 'HR practitioner', 'employer'],
      ['training', 'Training coordinator', 'employer'], ['finance', 'Finance reviewer', 'employer'],
      ['committee', 'Committee reviewer', 'employer'], ['signatory', 'Employer signatory', 'employer'],
      ['sdf', 'Appointed SDF', 'sdf'], ['ops', 'Imbhola operator', 'operations'],
      ['beacon-owner', 'Beacon owner', 'employer'],
    ];
    const insert = db.prepare(`INSERT INTO users VALUES(?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET password=excluded.password`);
    for (const [id, name, kind] of accounts) {
      insert.run(id, id + '@imbhola.test', name, hashPassword(password), kind, now());
    }
    const membership = db.prepare('INSERT OR IGNORE INTO membership VALUES(?,?,?,?)');
    for (const role of ['owner','hr','training','finance','committee','signatory']) {
      membership.run('atlas', role, role, null);
    }
    membership.run('beacon', 'beacon-owner', 'owner', null);
    membership.run('atlas', 'sdf', 'sdf', new Date(Date.now() + 365 * 86400_000).toISOString());

    const ofo = db.prepare('INSERT OR IGNORE INTO ofo VALUES(?,?,?,?)');
    ofo.run('synthetic-v1', '900001', 'Workshop Coordinator', 'Synthetic fixture');
    ofo.run('synthetic-v1', '900002', 'Learning Administrator', 'Synthetic fixture');
    const record = db.prepare('INSERT OR IGNORE INTO records VALUES(?,?,?,?)');
    record.run('atlas', 'demo-001', 'employee', JSON.stringify({
      number: 'AT-001', name: 'Sample Person', job: 'Workshop Coordinator', department: 'Operations', active: 'yes',
    }));
    record.run('beacon', 'demo-002', 'employee', JSON.stringify({
      number: 'BE-001', name: 'Example Person', job: 'Learning Administrator', department: 'Learning', active: 'yes',
    }));
    db.prepare(`INSERT OR IGNORE INTO commercial VALUES
      ('atlas','demo-subscription','subscription','Synthetic SaaS plan',0,'active','DEMO-001')`).run();
  });
}

if (process.argv[1]?.endsWith('/seed.ts')) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('Local seed only.');
  const password = randomBytes(18).toString('base64url');
  mkdirSync('.imbhola-local', { recursive: true, mode: 0o700 });
  const db = openDatabase('.imbhola-local/imbhola.sqlite');
  seed(db, password);
  db.exec('DELETE FROM sessions');
  db.close();
  console.log('Synthetic accounts: owner, hr, training, finance, committee, signatory, sdf, ops and beacon-owner @imbhola.test');
  console.log('Local password for this seed:', password);
}
