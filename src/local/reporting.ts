import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { digest, requireRole, type Actor } from './auth.ts';
import { audit, now, transaction } from './db.ts';
import { cents, readRecords, requireEntitlement } from './records.ts';

export function evidenceMetadata(db: DatabaseSync, tenant: string) {
  return db.prepare(`SELECT id,training_id,label,filename,digest,uploaded_at
    FROM evidence WHERE tenant=? ORDER BY uploaded_at,id`).all(tenant) as {
      id: string; training_id: string; label: string; filename: string; digest: string; uploaded_at: string;
    }[];
}

export function addEvidence(db: DatabaseSync, actor: Actor, tenant: string, trainingId: string, label: string,
  filename: string, mime: string, bytes: Uint8Array) {
  return transaction(db, () => {
    requireRole(db,actor,tenant,['owner','training','sdf']);
    requireEntitlement(db,tenant);
    if (!readRecords(db,tenant,'training').some(item => item.id === trainingId)) throw new Error('Choose training for this company.');
    if (!['attendance','certificate','payment'].includes(label)) throw new Error('Choose an evidence type.');
    if (!bytes.length || bytes.length > 2_000_000 || mime !== 'text/plain' || !/^[a-zA-Z0-9 _.-]{1,100}\.txt$/.test(filename)) {
      throw new Error('Upload a synthetic plain-text fixture under 2 MB.');
    }
    try {
      if (/\x00/.test(new TextDecoder('utf-8',{ fatal: true }).decode(bytes))) throw new Error();
    } catch {
      throw new Error('Upload a valid UTF-8 text fixture.');
    }
    const id = randomUUID();
    db.prepare('INSERT INTO evidence VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(tenant,id,trainingId,label,filename,mime,bytes,digest(bytes),now(),actor.id);
    audit(db,tenant,actor.id,'evidence.uploaded',id);
    return id;
  });
}

export function reportDraft(db: DatabaseSync, tenant: string, year: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2098) throw new Error('Choose a valid reporting year.');
  const company = db.prepare('SELECT id,name,seta,sdl,parent_id FROM tenants WHERE id=?').get(tenant);
  const employees = readRecords(db,tenant,'employee');
  const mappings = readRecords(db,tenant,'mapping').map(mapping => {
    const [version,code] = mapping.data.catalogue.split('/');
    const catalogue = db.prepare('SELECT version,code,title,source FROM ofo WHERE version=? AND code=?').get(version,code);
    return { ...mapping, catalogue };
  });
  const gaps = readRecords(db,tenant,'gap');
  const wsp = readRecords(db,tenant,'plan').filter(row => row.data.date.startsWith(String(year + 1)));
  const atr = readRecords(db,tenant,'training').filter(row => row.data.date.startsWith(String(year)));
  const payroll = readRecords(db,tenant,'payroll').filter(row => row.data.date.startsWith(String(year)));
  const consultation = readRecords(db,tenant,'consultation').filter(row => row.data.year === String(year));
  const evidence = evidenceMetadata(db,tenant).filter(row => atr.some(item => item.id === row.training_id));
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!company?.seta || !company?.sdl) blockers.push('Complete the company SDL and SETA profile.');
  if (!employees.length) blockers.push('Add at least one employee.');
  if (!consultation.length) blockers.push('Record committee consultation for the reporting year.');
  for (const item of employees.filter(row => row.data.active === 'yes')) {
    if (!mappings.some(mapping => mapping.data.employee === item.id && mapping.catalogue)) {
      blockers.push('Map the occupation for employee ' + item.data.number + '.');
    }
  }
  if (!wsp.length) warnings.push('There is no forward training plan.');
  if (!atr.length) warnings.push('There is no actual training recorded for this year.');
  if (!payroll.length) warnings.push('There are no payroll and levy records for this year.');
  for (const item of atr) {
    if (!evidence.some(file => file.training_id === item.id)) warnings.push('Evidence missing for ' + item.data.course + '.');
  }
  return {
    ruleVersion: 'local-synthetic-v1', year, company, employees, mappings, gaps, wsp, atr,
    payroll, consultation, evidence, blockers, warnings,
    totals: {
      plannedCents: wsp.reduce((sum,row) => sum + cents(row.data.cost),0),
      actualCents: atr.reduce((sum,row) => sum + cents(row.data.cost),0),
      levyCents: payroll.reduce((sum,row) => sum + cents(row.data.levy),0),
    },
  };
}

export function changeReport(db: DatabaseSync, actor: Actor, tenant: string, year: number,
  transition: string, version?: number, note = '') {
  return transaction(db, () => {
    requireEntitlement(db, tenant);
    if (transition === 'review') {
      requireRole(db,actor,tenant,['owner','sdf']);
      const current = db.prepare('SELECT version,status FROM reports WHERE tenant=? AND year=? ORDER BY version DESC LIMIT 1')
        .get(tenant,year);
      if (current?.status === 'review' || current?.status === 'approved') {
        throw new Error('Complete or return the current version first.');
      }
      const draft = reportDraft(db,tenant,year);
      if (draft.blockers.length) throw new Error('Resolve the reporting blockers before requesting review.');
      const snapshot = JSON.stringify(draft);
      const next = Number(current?.version ?? 0) + 1;
      db.prepare(`INSERT INTO reports(tenant,year,version,status,snapshot,digest,submitted_by)
        VALUES(?,?,?,'review',?,?,?)`).run(tenant,year,next,snapshot,digest(snapshot),actor.id);
      audit(db,tenant,actor.id,'report.review',year + '/' + next);
      return next;
    }
    if (!version || !Number.isInteger(version)) throw new Error('Choose a report version.');
    const report = db.prepare('SELECT * FROM reports WHERE tenant=? AND year=? AND version=?').get(tenant,year,version);
    if (!report || report.digest !== digest(String(report.snapshot))) throw new Error('Report unavailable.');
    if (transition === 'approved' || transition === 'returned') {
      requireRole(db,actor,tenant,['committee','owner']);
      if (report.status !== 'review' || report.submitted_by === actor.id) throw new Error('A separate reviewer must review this version.');
      if (transition === 'returned' && (!note.trim() || note.length > 500)) throw new Error('Enter review feedback up to 500 characters.');
      db.prepare('UPDATE reports SET status=?,approved_by=? WHERE tenant=? AND year=? AND version=?')
        .run(transition,actor.id,tenant,year,version);
    } else if (transition === 'signed') {
      requireRole(db,actor,tenant,['signatory','owner']);
      if (report.status !== 'approved' || report.approved_by === actor.id || report.submitted_by === actor.id) {
        throw new Error('A separate signatory must sign an approved version.');
      }
      db.prepare("UPDATE reports SET status='signed',signed_by=?,signed_at=? WHERE tenant=? AND year=? AND version=?")
        .run(actor.id,now(),tenant,year,version);
    } else {
      throw new Error('Unknown report action.');
    }
    const subject = year + '/' + version + (transition === 'returned' ? ' — ' + note.trim() : '');
    audit(db,tenant,actor.id,'report.' + transition,subject);
    return version;
  });
}
