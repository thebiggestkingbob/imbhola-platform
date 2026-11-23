import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';
import { hashPassword, type Actor } from './auth.ts';
import { now, openDatabase, transaction } from './db.ts';
import { addEvidence, changeReport } from './reporting.ts';

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

const walkthroughTenant = 'walkthrough';

export function seedWalkthrough(db: DatabaseSync, year: number) {
  const employee = 'walkthrough-employee';
  const training = 'walkthrough-training-' + year;
  const gap = 'walkthrough-gap';
  transaction(db, () => {
    db.prepare("INSERT OR IGNORE INTO tenants(id,name,seta,sdl) VALUES(?,'Cedar Workshop (synthetic)','Services SETA','SYNTH-CEDAR')")
      .run(walkthroughTenant);
    const membership = db.prepare('INSERT OR IGNORE INTO membership VALUES(?,?,?,?)');
    for (const role of ['owner','hr','training','finance','committee','signatory']) {
      membership.run(walkthroughTenant,role,role,null);
    }
    membership.run(walkthroughTenant,'sdf','sdf',new Date(Date.now() + 365 * 86400_000).toISOString());
    db.prepare(`INSERT OR IGNORE INTO commercial VALUES
      (?,'walkthrough-subscription','subscription','Sample SaaS plan',0,'active','SYNTH-CEDAR')`).run(walkthroughTenant);
    const add = db.prepare('INSERT OR IGNORE INTO records VALUES(?,?,?,?)');
    const record = (kind: string, id: string, data: Record<string,string>) =>
      add.run(walkthroughTenant,id,kind,JSON.stringify(data));
    record('employee',employee,{number:'CE-001',name:'Cedar Sample Employee',job:'Workshop Coordinator',department:'Operations',active:'yes'});
    record('mapping','walkthrough-mapping',{employee,catalogue:'synthetic-v1/900001',reason:'Sample job responsibilities match the catalogue entry.',override:'no'});
    record('gap',gap,{employee,skill:'Supervisor safety briefings',priority:'high'});
    record('plan','walkthrough-plan-' + year,{employee,gap,course:'Supervisor safety refresher',date:(year + 1) + '-03-14',cost:'1450.00',qualification:''});
    record('training',training,{employee,plan:'',course:'Workshop safety induction',date:year + '-05-12',provider:'Sample Training Provider',
      attendance:'attended',outcome:'completed',cost:'820.00',qualification:''});
    record('payroll','walkthrough-payroll-' + year,{date:year + '-05-31',payroll:'45000',levy:'450',reference:'SAMPLE-PAYROLL'});
    record('consultation','walkthrough-consultation-' + year,{date:year + '-06-03',year:String(year),
      attendees:'Sample committee representative, employer and SDF',decision:'Reviewed training priorities and approved preparation for committee review.'});
  });
  if (!db.prepare('SELECT 1 FROM reports WHERE tenant=? AND year=?').get(walkthroughTenant,year)) {
    const sdf: Actor = {id:'sdf',email:'sdf@imbhola.test',name:'Appointed SDF',kind:'sdf'};
    if (!db.prepare('SELECT 1 FROM evidence WHERE tenant=? AND training_id=? AND label=?')
      .get(walkthroughTenant,training,'attendance')) {
      addEvidence(db,sdf,walkthroughTenant,training,'attendance','cedar-attendance.txt',
        Buffer.from('Synthetic evidence. CE-001 attended the Workshop safety induction on ' + year + '-05-12.'));
    }
    changeReport(db,sdf,walkthroughTenant,year,'review');
  }
}

if (process.argv[1]?.endsWith('/seed.ts')) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('Local seed only.');
  const review = process.env.IMBHOLA_REVIEW === '1';
  const password = review ? process.env.IMBHOLA_REVIEW_PASSWORD : randomBytes(18).toString('base64url');
  if (!password || (review && (!/^[A-Za-z0-9_-]{24,128}$/.test(password) || process.env.VERCEL_ENV === 'production'))) {
    throw new Error('Supply a strong passcode for an isolated review.');
  }
  mkdirSync('.imbhola-local', { recursive: true, mode: 0o700 });
  const db = openDatabase(review ? '.imbhola-local/review.sqlite' : '.imbhola-local/imbhola.sqlite');
  seed(db, password);
  if (process.argv.includes('--walkthrough')) {
    const year = new Date().getFullYear();
    seedWalkthrough(db,year);
    console.log('Cedar Workshop sample is ready for committee review in ' + year + '.');
  }
  db.exec('DELETE FROM sessions');
  db.close();
  console.log('Synthetic accounts: owner, hr, training, finance, committee, signatory, sdf, ops and beacon-owner @imbhola.test');
  if (!review) console.log('Local password for this seed:', password);
}
