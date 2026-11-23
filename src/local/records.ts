import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { requireRole, type Actor, type Role } from './auth.ts';
import { audit, transaction } from './db.ts';

type Field = readonly [key: string, label: string, type?: 'date' | 'number', optional?: true];

export const sections = {
  employee: { label: 'Employees', roles: ['owner','hr','sdf'], fields: [
    ['number','Employee number'], ['name','Name'], ['job','Job title'], ['department','Department'], ['active','Active (yes or no)'],
  ] },
  mapping: { label: 'OFO mappings', roles: ['owner','hr','sdf'], fields: [
    ['employee','Employee'], ['catalogue','Catalogue version / code'], ['reason','Reason',undefined,true],
    ['override','Override (yes or no)'],
  ] },
  gap: { label: 'Skills gaps', roles: ['owner','hr','training','sdf'], fields: [
    ['employee','Employee'], ['skill','Skill needed'], ['priority','Priority (high, medium or low)'],
  ] },
  plan: { label: 'WSP training plans', roles: ['owner','training','sdf'], fields: [
    ['employee','Employee'], ['gap','Skills gap',undefined,true], ['course','Course'],
    ['date','Planned date','date'], ['cost','Budget in rand','number'], ['qualification','PIVOTAL qualification',undefined,true],
  ] },
  training: { label: 'ATR training records', roles: ['owner','training','sdf'], fields: [
    ['employee','Employee'], ['plan','Related plan',undefined,true], ['course','Course'],
    ['date','Training date','date'], ['provider','Provider'], ['attendance','Attendance (attended or absent)'],
    ['outcome','Outcome (completed, in progress or withdrawn)'], ['cost','Actual cost in rand','number'],
    ['qualification','PIVOTAL qualification',undefined,true],
  ] },
  payroll: { label: 'Payroll and skills levies', roles: ['owner','finance'], fields: [
    ['date','Period ending','date'], ['payroll','Payroll in rand','number'], ['levy','Levy in rand','number'], ['reference','Reference'],
  ] },
  consultation: { label: 'Committee consultation', roles: ['owner','committee','sdf'], fields: [
    ['date','Meeting date','date'], ['year','Reporting year','number'], ['attendees','Attendees'], ['decision','Decision and notes'],
  ] },
  submission: { label: 'External receipts and grants', roles: ['owner','sdf','signatory'], fields: [
    ['report','Signed report'], ['date','Event date','date'], ['reference','External reference'],
    ['event','Event (receipt, correction, decision or grant)'], ['amount','Grant in rand','number',true],
    ['notes','Notes',undefined,true],
  ] },
} as const satisfies Record<string, {label: string; roles: readonly Role[]; fields: readonly Field[]}>;

export type RecordKind = keyof typeof sections;
export type Data = Record<string, string>;
export type Entry = { id: string; data: Data };
export const cents = (value: string) => Math.round(Number(value) * 100);

export function isRecordKind(value: string): value is RecordKind {
  return Object.hasOwn(sections, value);
}

export function canView(kind: RecordKind, role: Role) {
  if (kind === 'payroll') return ['owner','finance','sdf','signatory'].includes(role);
  return true;
}

export function readRecords(db: DatabaseSync, tenant: string, kind: RecordKind): Entry[] {
  const rows = db.prepare('SELECT id,data FROM records WHERE tenant=? AND kind=? ORDER BY id').all(tenant, kind);
  return rows.map(row => ({ id: String(row.id), data: JSON.parse(String(row.data)) }));
}

function validate(db: DatabaseSync, tenant: string, kind: RecordKind, data: Data, id?: string) {
  const fields: readonly Field[] = sections[kind].fields;
  const clean: Data = {};
  for (const [key,label,type,optional] of fields) {
    const value = (data[key] ?? '').trim();
    if (!value && !optional) throw new Error(label + ' is required.');
    if (value.length > 500) throw new Error(label + ' exceeds 500 characters.');
    if (value && type === 'date') {
      const parsed = new Date(value);
      if (!/^20\d\d-\d\d-\d\d$/.test(value) || !Number.isFinite(+parsed) || parsed.toISOString().slice(0,10) !== value) {
        throw new Error(label + ' must be a valid date.');
      }
    }
    if (value && type === 'number' && !/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
      throw new Error(label + ' must be a non-negative number with at most two decimal places.');
    }
    clean[key] = value;
  }
  const choices: Partial<Record<RecordKind, Record<string, readonly string[]>>> = {
    employee: { active: ['yes','no'] }, mapping: { override: ['yes','no'] },
    gap: { priority: ['high','medium','low'] }, training: {
      attendance: ['attended','absent'], outcome: ['completed','in progress','withdrawn'],
    },
    submission: { event: ['receipt','correction','decision','grant'] },
  };
  for (const [key, values] of Object.entries(choices[kind] ?? {})) {
    if (!values.includes(clean[key])) throw new Error('Choose a valid ' + key + '.');
  }
  for (const [field, target] of [['employee','employee'],['gap','gap'],['plan','plan']] as const) {
    if (!clean[field]) continue;
    const row = db.prepare('SELECT data FROM records WHERE tenant=? AND kind=? AND id=?').get(tenant, target, clean[field]);
    if (!row || (target !== 'employee' && JSON.parse(String(row.data)).employee !== clean.employee)) {
      throw new Error('Select a ' + field + ' for this employee and company.');
    }
  }
  if (kind === 'employee' && db.prepare(`SELECT 1 FROM records WHERE tenant=? AND kind='employee'
    AND lower(json_extract(data,'$.number'))=lower(?) AND id != ?`).get(tenant,clean.number,id ?? '')) {
    throw new Error('This employee number already exists.');
  }
  if (kind === 'mapping') {
    const [version, code, extra] = clean.catalogue.split('/');
    if (extra || !db.prepare('SELECT 1 FROM ofo WHERE version=? AND code=?').get(version ?? '',code ?? '')) {
      throw new Error('Select a catalogue entry.');
    }
    if (clean.override === 'yes' && !clean.reason) throw new Error('Give a reason for the override.');
    if (db.prepare(`SELECT 1 FROM records WHERE tenant=? AND kind='mapping'
      AND json_extract(data,'$.employee')=? AND id != ?`).get(tenant,clean.employee,id ?? '')) {
      throw new Error('Edit the existing mapping for this employee.');
    }
  }
  if (kind === 'consultation' && !/^20\d{2}$/.test(clean.year)) throw new Error('Enter a reporting year such as 2026.');
  if (kind === 'training' && clean.attendance === 'absent' && clean.outcome === 'completed') {
    throw new Error('An absent participant cannot have a completed outcome.');
  }
  if (kind === 'submission') {
    const [year, version, extra] = clean.report.split('/');
    if (extra || !db.prepare(`SELECT 1 FROM reports WHERE tenant=? AND year=? AND version=? AND status='signed'`)
      .get(tenant,year,version ?? '')) throw new Error('Select a signed report for this company.');
    if (clean.event === 'grant' && !clean.amount) throw new Error('Enter the grant amount.');
    if (clean.event !== 'receipt' && !db.prepare(`SELECT 1 FROM records WHERE tenant=? AND kind='submission'
      AND json_extract(data,'$.report')=? AND json_extract(data,'$.event')='receipt'`).get(tenant,clean.report)) {
      throw new Error('Record the external receipt before adding an outcome.');
    }
  }
  return clean;
}

export function requireEntitlement(db: DatabaseSync, tenant: string) {
  const active = db.prepare(`SELECT 1 FROM commercial WHERE tenant=? AND type IN ('subscription','managed contract')
    AND status='active' LIMIT 1`).get(tenant);
  if (!active) throw new Error('An active subscription or managed contract is required.');
}

export function saveRecord(db: DatabaseSync, actor: Actor, tenant: string, kind: RecordKind, data: Data, id?: string) {
  return transaction(db, () => {
    requireRole(db, actor, tenant, sections[kind].roles);
    requireEntitlement(db, tenant);
    const clean = validate(db, tenant, kind, data, id);
    const key = id || randomUUID();
    if (id) {
      if (kind === 'submission') throw new Error('External filing history is append-only.');
      const change = db.prepare('UPDATE records SET data=? WHERE tenant=? AND kind=? AND id=?')
        .run(JSON.stringify(clean), tenant, kind, key);
      if (!change.changes) throw new Error('Record not found in this company.');
    } else {
      db.prepare('INSERT INTO records VALUES(?,?,?,?)').run(tenant,key,kind,JSON.stringify(clean));
    }
    audit(db,tenant,actor.id,id ? 'record.updated' : 'record.created',kind + '/' + key);
    return key;
  });
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let state: 'plain' | 'quoted' | 'closed' = 'plain';
  const csv = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (state === 'quoted') {
      if (char !== '"') field += char;
      else if (csv[index + 1] === '"') { field += '"'; index++; }
      else state = 'closed';
    } else if (char === ',' || char === '\n') {
      row.push(field);
      field = '';
      state = 'plain';
      if (char === '\n') { rows.push(row); row = []; }
    } else if (char === '"' && !field && state === 'plain') {
      state = 'quoted';
    } else {
      if (state === 'closed' || char === '"') throw new Error('CSV contains an invalid quoted field.');
      field += char;
    }
  }
  if (state === 'quoted') throw new Error('CSV contains an unclosed quoted field.');
  if (row.length || field || state === 'closed') rows.push([...row,field]);
  return rows;
}

export function workforceImport(db: DatabaseSync, actor: Actor, tenant: string, csv: string, commit = false) {
  const execute = () => {
    requireRole(db, actor, tenant, sections.employee.roles);
    requireEntitlement(db, tenant);
    if (csv.length > 250_000) throw new Error('Use a CSV under 250 KB.');
    const [headers, ...rows] = parseCsv(csv);
    const keys = sections.employee.fields.map(field => field[0]);
    if (headers?.join(',') !== keys.join(',')) throw new Error('Expected these columns: ' + keys.join(', ') + '.');
    if (!rows.length || rows.length > 500) throw new Error('Provide between 1 and 500 employee rows.');
    const seen = new Set<string>();
    const entries: Data[] = [];
    const errors: string[] = [];
    for (const [index,row] of rows.entries()) {
      try {
        if (row.length !== keys.length) throw new Error('Wrong number of columns.');
        const data = validate(db,tenant,'employee',Object.fromEntries(keys.map((key,i) => [key,row[i]])));
        const number = data.number.toLowerCase();
        if (seen.has(number)) throw new Error('Duplicate employee number in this file.');
        seen.add(number);
        entries.push(data);
      } catch (error) {
        errors.push('Row ' + (index + 2) + ' — ' + (error as Error).message);
      }
    }
    if (commit && !errors.length) {
      const insert = db.prepare("INSERT INTO records VALUES(?,?,'employee',?)");
      for (const entry of entries) insert.run(tenant,randomUUID(),JSON.stringify(entry));
      audit(db,tenant,actor.id,'workforce.imported',String(entries.length));
    }
    return { entries, errors, committed: commit && errors.length === 0 };
  };
  return commit ? transaction(db, execute) : execute();
}
