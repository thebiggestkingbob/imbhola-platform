import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { DatabaseSync } from 'node:sqlite';
import { requireRole, roleFor, sessionActor, signIn, type Actor, type Kind } from './auth.ts';
import { openDatabase } from './db.ts';
import { acceptInvitation, captureLead, createCompany, createSupportRequest, recordReportingSource, register, resolveSupportRequest,
  saveCommercial, setMembership, updateCompany, verifyAccount } from './operations.ts';
import { localWorkspaceEnabled, reviewWorkspaceEnabled } from './mode.ts';
import { readRecords, saveRecord, workforceImport } from './records.ts';
import { addEvidence, changeReport, evidenceMetadata, frozenReport, readEvidence, reportDraft } from './reporting.ts';
import { seed, seedWalkthrough } from './seed.ts';
import { reportWorkbook } from './report-workbook.ts';

import { hasReviewCookie, reviewCookieToken } from './review-gate.ts';
import { reviewLauncherPassword, reviewPasscodeMatches } from './review-launcher.ts';

const password = 'synthetic-password-for-tests';
const actor = (id: string, kind: Kind = 'employer'): Actor => ({id,name:id,email:id + '@imbhola.test',kind});
const owner = actor('owner');
const sdf = actor('sdf','sdf');
const ops = actor('ops','operations');
function fixture(run: (db: DatabaseSync) => void) {
  const db = openDatabase(':memory:');
  try { seed(db,password); run(db); } finally { db.close(); }
}

test('synthetic accounts authenticate with expiring hashed sessions and tenant-scoped access', () => fixture(db => {
  assert.equal(signIn(db,owner.email,'incorrect'),undefined);
  const token = signIn(db,owner.email,password);
  assert.ok(token);
  assert.equal(sessionActor(db,token)?.id,owner.id);
  assert.notEqual(db.prepare('SELECT token FROM sessions').get()?.token,token);
  assert.throws(() => requireRole(db,owner,'beacon'),/access/);
  assert.equal(roleFor(db,sdf,'beacon'),undefined);
  assert.equal(roleFor(db,sdf,'atlas'),'sdf');
  db.prepare("UPDATE membership SET expires='2000-01-01' WHERE role='sdf'").run();
  assert.equal(roleFor(db,sdf,'atlas'),undefined);
  db.prepare("UPDATE sessions SET expires='2000-01-01'").run();
  assert.equal(sessionActor(db,token),undefined);
}));

test('onboarding, subsidiary profile, invitation and SDF appointment', () => fixture(db => {
  register(db,'Synthetic Team Member','new-hire@imbhola.test',password);
  assert.equal(signIn(db,'new-hire@imbhola.test',password),undefined);
  const id = String(db.prepare("SELECT id FROM users WHERE email='new-hire@imbhola.test'").get()?.id);
  assert.throws(() => verifyAccount(db,owner,id),/Operations/);
  verifyAccount(db,ops,id);
  const hire = sessionActor(db,signIn(db,'new-hire@imbhola.test',password));
  assert.ok(hire);
  const tenant = createCompany(db,owner,'Synthetic subsidiary');
  updateCompany(db,owner,tenant,'DEMO-SUB','Services SETA','atlas');
  assert.throws(() => updateCompany(db,owner,'atlas','DEMO-ATLAS','Services SETA',tenant),/ancestor/);
  setMembership(db,owner,tenant,hire.email,'hr','');
  assert.equal(roleFor(db,hire,tenant),undefined);
  assert.throws(() => acceptInvitation(db,actor('hr'),tenant),/unavailable/);
  acceptInvitation(db,hire,tenant);
  assert.equal(roleFor(db,hire,tenant),'hr');
  assert.throws(() => setMembership(db,owner,tenant,sdf.email,'sdf','2000-01-01'),/future/);
  setMembership(db,owner,tenant,sdf.email,'sdf','2099-01-01');
  assert.equal(roleFor(db,sdf,tenant),'sdf');
  setMembership(db,owner,tenant,sdf.email,'revoke','');
  assert.equal(roleFor(db,sdf,tenant),undefined);
}));

test('workforce CSV preview validates quoting and duplicates and commits atomically', () => fixture(db => {
  const headers = 'number,name,job,department,active\r\n';
  const row = 'AT-002,"Example, Person","Workshop ""Lead""",Operations,yes';
  const preview = workforceImport(db,owner,'atlas',headers + row);
  assert.equal(preview.entries[0].job,'Workshop "Lead"');
  assert.equal(readRecords(db,'atlas','employee').length,1);
  const rejected = workforceImport(db,owner,'atlas',headers + row + '\r\n' + row,true);
  assert.match(rejected.errors[0],/Row 3.*Duplicate/);
  assert.equal(readRecords(db,'atlas','employee').length,1);
  assert.equal(workforceImport(db,owner,'atlas',headers + row,true).committed,true);
  assert.equal(readRecords(db,'atlas','employee').length,2);
  assert.equal(workforceImport(db,owner,'atlas',headers + row,true).committed,false);
  assert.throws(() => workforceImport(db,owner,'beacon',headers + row,true),/access/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='workforce.imported'").get()?.n,1);
  assert.throws(() => db.prepare('DELETE FROM audit').run(),/append-only/);
}));

test('training, evidence, WSP and ATR flow to a frozen reviewed and signed report and external outcomes', () => fixture(db => {
  assert.throws(() => saveRecord(db,sdf,'atlas','mapping',{
    employee:'demo-001',catalogue:'synthetic-v1/900001',reason:'',override:'yes',
  }),/reason/);
  assert.throws(() => saveRecord(db,sdf,'atlas','mapping',{
    employee:'demo-002',catalogue:'synthetic-v1/900001',reason:'',override:'no',
  }),/company/);
  saveRecord(db,sdf,'atlas','mapping',{employee:'demo-001',catalogue:'synthetic-v1/900001',reason:'Demo rationale',override:'yes'});
  const gap = saveRecord(db,sdf,'atlas','gap',{employee:'demo-001',skill:'Workshop safety',priority:'high'});
  const plan = saveRecord(db,sdf,'atlas','plan',{
    employee:'demo-001',gap,course:'Workshop safety',date:'2027-04-20',cost:'1500.10',qualification:'Synthetic qualification',
  });
  const training = saveRecord(db,sdf,'atlas','training',{
    employee:'demo-001',course:'Intro to workshop safety',date:'2026-04-20',cost:'825.15',provider:'Synthetic provider',
    attendance:'attended',outcome:'completed',
  });
  assert.throws(() => addEvidence(db,owner,'atlas',training,'attendance','bad.html',Buffer.from('<b>hi</b>')),/synthetic PDF/);
  assert.throws(() => addEvidence(db,owner,'atlas',training,'attendance','bad.pdf',Buffer.from('<b>hi</b>')),/synthetic PDF/);
  const file = addEvidence(db,owner,'atlas',training,'attendance','fixture.txt',Buffer.from('Synthetic attendance'));
  assert.equal(evidenceMetadata(db,'atlas')[0].id,file);
  assert.deepEqual(evidenceMetadata(db,'beacon'),[]);
  assert.equal(Buffer.from(readEvidence(db,sdf,'atlas',file)!.bytes).toString(),'Synthetic attendance');
  const sample = Buffer.from('%PDF-1.4\nSynthetic certificate fixture\n%%EOF\n');
  const certificate = addEvidence(db,sdf,'atlas',training,'certificate','Sample certificate.pdf',sample);
  assert.deepEqual(Buffer.from(readEvidence(db,owner,'atlas',certificate)!.bytes),sample);
  assert.equal(readEvidence(db,actor('beacon-owner'),'atlas',certificate),undefined);
  assert.equal(readEvidence(db,owner,'beacon',certificate),undefined);
  assert.throws(() => db.prepare('UPDATE evidence SET bytes=? WHERE id=?').run(sample,file),/immutable/);
  assert.throws(() => changeReport(db,sdf,'atlas',2026,'review'),/blockers/);
  saveRecord(db,actor('committee'),'atlas','consultation',{
    date:'2026-11-15',year:'2026',attendees:'Synthetic committee',decision:'Ready to review',
  });
  assert.equal(reportDraft(db,'atlas',2026).wsp[0].id,plan);
  assert.deepEqual(reportDraft(db,'atlas',2026).totals,{plannedCents:150010,actualCents:82515,levyCents:0});
  const version = changeReport(db,owner,'atlas',2026,'review');
  assert.throws(() => changeReport(db,owner,'atlas',2026,'approved',version),/separate reviewer/);
  changeReport(db,actor('committee'),'atlas',2026,'returned',version,'Correct the planned budget');
  const revised = changeReport(db,sdf,'atlas',2026,'review');
  assert.equal(revised,version + 1);
  const snapshot = db.prepare('SELECT snapshot FROM reports WHERE version=?').get(revised)?.snapshot;
  changeReport(db,actor('committee'),'atlas',2026,'approved',revised);
  assert.throws(() => changeReport(db,actor('committee'),'atlas',2026,'signed',revised),/access/);
  changeReport(db,actor('signatory'),'atlas',2026,'signed',revised);
  assert.throws(() => db.prepare("UPDATE reports SET snapshot='{}' WHERE version=?").run(revised),/immutable/);
  saveRecord(db,owner,'atlas','employee',{number:'AT-001',name:'Updated Sample',job:'Workshop Coordinator',department:'Operations',active:'yes'},'demo-001');
  assert.equal(db.prepare('SELECT snapshot FROM reports WHERE version=?').get(revised)?.snapshot,snapshot);
  const receipt = {report:'2026/' + revised,date:'2027-03-20',reference:'SYNTH-RECEIPT',event:'receipt'};
  assert.throws(() => saveRecord(db,owner,'atlas','submission',{...receipt,event:'grant',amount:'120'}),/receipt before/);
  saveRecord(db,owner,'atlas','submission',receipt);
  saveRecord(db,owner,'atlas','submission',{...receipt,event:'grant',amount:'120'});
  assert.equal(readRecords(db,'atlas','submission').length,2);
  assert.equal(reportDraft(db,'atlas',2026).ruleVersion,'local-synthetic-v1');
}));

test('commercial entitlement, consented capture and support resolution are persisted', () => fixture(db => {
  const beacon = actor('beacon-owner');
  const employee = {number:'BE-002',name:'Test employee',job:'Role',department:'Test',active:'yes'};
  assert.throws(() => saveRecord(db,beacon,'beacon','employee',employee),/active subscription/);
  assert.throws(() => saveCommercial(db,owner,'beacon','subscription','Plan','100','active','test',''),/Operations/);
  saveCommercial(db,ops,'beacon','invoice','Invoice','100','paid','test','');
  assert.throws(() => saveRecord(db,beacon,'beacon','employee',employee),/active subscription/);
  saveCommercial(db,ops,'beacon','managed contract','Managed service','100','active','test','');
  assert.ok(saveRecord(db,beacon,'beacon','employee',employee));
  assert.throws(() => captureLead(db,'Demo','name@imbhola.test','Company','demo',false),/consent/);
  captureLead(db,'Demo','name@imbhola.test','Company','demo',true);
  assert.equal(db.prepare('SELECT consent_version FROM leads').get()?.consent_version,'local-notice-v1');
  createSupportRequest(db,beacon,'beacon','Demo help','Need help with synthetic OFO data');
  const id = String(db.prepare('SELECT id FROM support').get()?.id);
  assert.throws(() => resolveSupportRequest(db,beacon,id),/Operations/);
  resolveSupportRequest(db,ops,id);
  assert.equal(db.prepare('SELECT status FROM support').get()?.status,'resolved');
}));

test('walkthrough provides a real frozen report that reviewers can approve and sign locally', () => fixture(db => {
  seedWalkthrough(db,2026);
  seedWalkthrough(db,2026);
  const tenant = 'walkthrough';
  const initial = frozenReport(db,actor('committee'),tenant,'2026','1');
  assert.ok(initial);
  assert.equal(initial.status,'review');
  assert.equal(initial.preparedName,'Appointed SDF');
  assert.equal(initial.report.wsp[0].data.course,'Supervisor safety refresher');
  assert.equal(initial.report.atr[0].data.course,'Workshop safety induction');
  assert.equal(frozenReport(db,actor('beacon-owner'),tenant,'2026','1'),undefined);
  assert.equal(frozenReport(db,ops,tenant,'2026','1'),undefined);
  assert.equal(frozenReport(db,actor('hr'),tenant,'2026','1'),undefined);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM reports WHERE tenant=?').get(tenant)?.total,1);
  changeReport(db,actor('committee'),tenant,2026,'approved',1);
  changeReport(db,actor('signatory'),tenant,2026,'signed',1);
  const signed = frozenReport(db,owner,tenant,'2026','1');
  assert.equal(signed?.status,'signed');
  assert.equal(signed?.signedName,'Employer signatory');
  assert.equal(signed?.digest,initial.digest);
}));

test('internal Excel downloads use the frozen version and label the workbook for review', async () => {
  const db = openDatabase(':memory:');
  try {
    seed(db,password);
    seedWalkthrough(db,2026);
    const frozen = frozenReport(db,actor('committee'),'walkthrough','2026','1');
    assert.ok(frozen);
    const bytes = await reportWorkbook(frozen,'1');
    assert.equal(bytes.subarray(0,4).toString('hex'),'504b0304');
    assert.ok(bytes.includes(Buffer.from('xl/workbook.xml')));
    assert.ok(bytes.includes(Buffer.from('xl/worksheets/sheet9.xml')));
  } finally {
    db.close();
  }
});

test('only operations can record immutable reporting-source revisions', () => fixture(db => {
  const source = {year:'2026',title:'Mandatory grant forms',revision:'2026 sample',
    url:'https://servicesseta.org.za/example.pdf',sha256:'a'.repeat(64)};
  assert.throws(() => recordReportingSource(db,owner,source),/Operations/);
  assert.throws(() => recordReportingSource(db,ops,{...source,url:'https://servicesseta.org.za.example.com/forms.pdf'}),/direct HTTPS/);
  assert.throws(() => recordReportingSource(db,ops,{...source,sha256:'unverified'}),/checksum/);
  const id = recordReportingSource(db,ops,source);
  assert.equal(db.prepare('SELECT recorded_by FROM reporting_sources WHERE id=?').get(id)?.recorded_by,ops.id);
  assert.throws(() => recordReportingSource(db,ops,source),/already recorded/);
  assert.throws(() => db.prepare('DELETE FROM reporting_sources WHERE id=?').run(id),/history/);
  assert.equal(db.prepare("SELECT count(*) AS total FROM audit WHERE action='reporting_source.recorded'").get()?.total,1);
}));

test('workspace development authentication stays disabled in hosted and production environments', t => {
  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  Reflect.set(process.env,'NODE_ENV','production');
  process.env.IMBHOLA_LOCAL = '1';
  assert.equal(localWorkspaceEnabled(),false);
  Reflect.set(process.env,'NODE_ENV','development');
  process.env.VERCEL = '1';
  assert.equal(localWorkspaceEnabled(),false);
  delete process.env.VERCEL;
  assert.equal(localWorkspaceEnabled(),true);
  Reflect.set(process.env,'NODE_ENV','production');
  process.env.IMBHOLA_REVIEW = '1';
  assert.equal(reviewWorkspaceEnabled(),true);
  process.env.VERCEL = '1';
  assert.equal(localWorkspaceEnabled(),false);
  delete process.env.VERCEL;
  process.env.VERCEL_ENV = 'production';
  assert.equal(localWorkspaceEnabled(),false);
});

test('review launcher is restricted to the draft branch preview and checks its passcode', t => {
  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  const passcode = 'synthetic-review-000000000000';
  process.env.IMBHOLA_PREVIEW_REVIEW_PASSWORD = passcode;
  process.env.VERCEL_GIT_COMMIT_REF = 'feature/v3-3-platform-foundation';
  process.env.VERCEL_ENV = 'production';
  assert.equal(reviewLauncherPassword(),undefined);
  process.env.VERCEL_ENV = 'preview';
  process.env.VERCEL_GIT_COMMIT_REF = 'main';
  assert.equal(reviewLauncherPassword(),undefined);
  process.env.VERCEL_GIT_COMMIT_REF = 'feature/v3-3-platform-foundation';
  assert.equal(reviewLauncherPassword(),passcode);
  assert.equal(reviewPasscodeMatches(passcode,passcode),true);
  assert.equal(reviewPasscodeMatches('incorrect',passcode),false);
});


test('test-account selection requires a current private review cookie', () => {
  const now = 1_800_000_000_000;
  const token = reviewCookieToken(password,'1800000060');
  assert.equal(hasReviewCookie(token,password,now),true);
  assert.equal(hasReviewCookie(token,password,now + 60_000),false);
  assert.equal(hasReviewCookie(token,'other review passcode',now),false);
  assert.equal(hasReviewCookie('1800000100' + token.slice(10),password,now),false);
  assert.equal(hasReviewCookie(undefined,password,now),false);
});
