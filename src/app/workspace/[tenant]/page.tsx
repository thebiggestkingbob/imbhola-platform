import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { DatabaseSync } from 'node:sqlite';
import LocalForm from '@/components/LocalForm';
import { Input, Select, Table, WorkspaceShell, rand } from '@/components/LocalUI';
import { roleFor, type Role } from '@/local/auth';
import { localDb } from '@/local/db';
import { canView, isRecordKind, readRecords, sections, type Data, type RecordKind } from '@/local/records';
import { evidenceMetadata, reportDraft, reportRoles } from '@/local/reporting';
import { requireActor } from '@/local/session';

type Choice = readonly [string,string];
type FormOptions = Record<string, Choice[]>;
const fixed: Record<string,string[]> = {
  active:['yes','no'], override:['yes','no'], priority:['high','medium','low'],
  attendance:['attended','absent'], outcome:['completed','in progress','withdrawn'],
  event:['receipt','correction','decision','grant'],
};

function RecordEditor({ tenant, kind, options, id, data = {} }: {
  tenant: string; kind: RecordKind; options: FormOptions; id?: string; data?: Data;
}) {
  return <LocalForm fields={{task:'record',tenant,kind,id:id ?? ''}} label={id ? 'Save changes' : 'Add record'}>
    {sections[kind].fields.map(([key,label,type,optional]) => {
      const choices = options[key] ?? fixed[key]?.map(value => [value,value] as const);
      return choices ? <Select key={key} name={key} label={label} choices={choices} value={data[key]} optional={optional}/>
        : <Input key={key} name={key} label={label} type={type} value={data[key]} optional={optional}/>;
    })}
  </LocalForm>;
}

function RecordsPanel({ db, tenant, kind, role }: { db: DatabaseSync; tenant: string; kind: RecordKind; role: Role }) {
  const section = sections[kind];
  const writable = (section.roles as readonly Role[]).includes(role);
  const catalogue = db.prepare('SELECT * FROM ofo ORDER BY version,code').all();
  const options: FormOptions = {
    employee: readRecords(db,tenant,'employee').map(({id,data}) => [id,data.number + ' · ' + data.name]),
    gap: readRecords(db,tenant,'gap').map(({id,data}) => [id,data.skill]),
    plan: readRecords(db,tenant,'plan').map(({id,data}) => [id,data.course]),
    catalogue: catalogue.map(row => [row.version + '/' + row.code,row.code + ' · ' + row.title + ' (' + row.version + ')']),
    report: db.prepare("SELECT year,version FROM reports WHERE tenant=? AND status='signed' ORDER BY year DESC,version DESC")
      .all(tenant).map(row => [row.year + '/' + row.version,row.year + ' · Version ' + row.version]),
  };
  const rows = readRecords(db,tenant,kind);
  return <section className="workspace-panel">
    <h2>{section.label}</h2>
    {kind === 'mapping' && <p>Available catalogue entries are synthetic. Describe the reason for any override.</p>}
    {kind === 'submission' && <p>Record events after an authorised person completes them externally. Start with the receipt.</p>}
    <Table columns={[...section.fields.map(field => field[1]),...(writable && kind !== 'submission' ? ['Edit'] : [])]}
      rows={rows.map(({id,data}) => [
        ...section.fields.map(([key]) => options[key]?.find(([value]) => value === data[key])?.[1] ?? data[key]),
        ...(writable && kind !== 'submission' ? [<details key="edit"><summary>Edit record</summary>
          <RecordEditor tenant={tenant} kind={kind} options={options} id={id} data={data}/></details>] : []),
      ])}/>
    {writable && <details><summary>Add record</summary><RecordEditor tenant={tenant} kind={kind} options={options}/></details>}
    {writable && kind === 'employee' && <details><summary>Import workforce CSV</summary>
      <p>Use the column order below. Preview the results before committing. Any invalid row prevents the import.</p>
      <code>number,name,job,department,active</code>
      <LocalForm fields={{task:'import',tenant}} label="Preview import" importForm/>
    </details>}
  </section>;
}

function EvidencePanel({ db, tenant, role }: { db: DatabaseSync; tenant: string; role: Role }) {
  const sessions = readRecords(db,tenant,'training').map(({id,data}) => [id,data.course + ' · ' + data.date] as const);
  return <section className="workspace-panel">
    <h2>Evidence vault</h2>
    <p>Upload synthetic UTF-8 text fixtures. Access is scoped to this company.</p>
    <Table columns={['Type','Training','File','Date']} rows={evidenceMetadata(db,tenant).map(file => [
      file.label,sessions.find(([id]) => id === file.training_id)?.[1],
      <Link key="file" href={'/evidence/' + tenant + '/' + file.id}>{file.filename}</Link>,file.uploaded_at.slice(0,10),
    ])}/>
    {['owner','training','sdf'].includes(role) && <details><summary>Upload evidence</summary>
      <LocalForm fields={{task:'evidence',tenant}} label="Upload text fixture">
        <Select name="training" label="Training record" choices={sessions}/>
        <Select name="label" label="Evidence type" choices={['attendance','certificate','payment'].map(type => [type,type])}/>
        <label>Synthetic text fixture<input name="file" type="file" accept=".txt,text/plain" required/></label>
      </LocalForm>
    </details>}
  </section>;
}

function ReportPanel({ db, tenant, role, year, actorId }: { db: DatabaseSync; tenant: string; role: Role; year: number; actorId: string }) {
  const draft = reportDraft(db,tenant,year);
  const versions = db.prepare(`SELECT year,version,status,digest,submitted_by,approved_by,signed_by,signed_at
    FROM reports WHERE tenant=? AND year=? ORDER BY version DESC`).all(tenant,year);
  const history = db.prepare(`SELECT action,subject,created_at FROM audit WHERE tenant=? AND action LIKE 'report.%'
    AND subject LIKE ? ORDER BY id DESC`).all(tenant,year + '/%');
  return <section className="workspace-panel">
    <h2>WSP and ATR reporting</h2>
    <p>ATR actuals for {year} and WSP plans for {year + 1}. Internal rules {draft.ruleVersion}. Official Services SETA exports are disabled.</p>
    <form className="workspace-form" method="get">
      <input type="hidden" name="tab" value="reports"/>
      <label>ATR reporting year<input type="number" name="year" min="2000" max="2098" defaultValue={year}/></label>
      <div><button className="button button-small">View year</button></div>
    </form>
    <dl className="workspace-metrics">
      <div><dt>WSP budget</dt><dd>{rand.format(draft.totals.plannedCents / 100)}</dd></div>
      <div><dt>ATR actual cost</dt><dd>{rand.format(draft.totals.actualCents / 100)}</dd></div>
      <div><dt>Skills levies recorded</dt><dd>{rand.format(draft.totals.levyCents / 100)}</dd></div>
    </dl>
    <h3>Readiness checks</h3>
    <Table columns={['Severity','Check']} rows={[
      ...draft.blockers.map(item => ['Blocker',item]),
      ...draft.warnings.map(item => ['Warning',item]),
      ...(!draft.blockers.length && !draft.warnings.length ? [['Ready','Internal checks passed']] : []),
    ]}/>
    <details><summary>Working report</summary>
      <Table columns={['Report','Course','Employee','Date','Amount']} rows={[
        ...draft.wsp.map(({data}) => ['WSP',data.course,draft.employees.find(row => row.id === data.employee)?.data.number,data.date,rand.format(Number(data.cost))]),
        ...draft.atr.map(({data}) => ['ATR',data.course,draft.employees.find(row => row.id === data.employee)?.data.number,data.date,rand.format(Number(data.cost))]),
      ]}/>
    </details>
    {['owner','sdf'].includes(role) && !draft.blockers.length && !['review','approved'].includes(String(versions[0]?.status)) &&
      <LocalForm fields={{task:'report',tenant,year:String(year),transition:'review'}} label="Request committee review"/>}
    <h3>Version history</h3>
    <Table columns={['Version','Status','Snapshot','Actions']} rows={versions.map(row => {
      const base = {task:'report',tenant,year:String(row.year),version:String(row.version)};
      const reviewer = row.status === 'review' && row.submitted_by !== actorId && ['committee','owner'].includes(role);
      const signatory = row.status === 'approved' && row.approved_by !== actorId && row.submitted_by !== actorId &&
        ['signatory','owner'].includes(role);
      return [String(row.version),String(row.status),
        <div key="snapshot" className="report-version-links">
          <Link href={'/report-review/' + tenant + '/' + row.year + '/' + row.version}>Read frozen report</Link>
          <Link href={'/report-snapshot/' + tenant + '/' + row.year + '/' + row.version}>Download JSON</Link>
        </div>,
        <div key="actions">
          {reviewer && <>
            <LocalForm fields={{...base,transition:'approved'}} label="Approve version"/>
            <LocalForm fields={{...base,transition:'returned'}} label="Return for changes"><Input name="note" label="Feedback"/></LocalForm>
          </>}
          {signatory && <LocalForm fields={{...base,transition:'signed'}} label="Sign frozen version"/>}
          {row.signed_at ? 'Signed ' + String(row.signed_at).slice(0,10) : null}
        </div>];
    })}/>
    <details><summary>Approval audit history</summary>
      <Table columns={['Event','Details','Time']} rows={history.map(row => [String(row.action),String(row.subject),String(row.created_at)])}/>
    </details>
  </section>;
}

function ReportingProgress({ db, tenant, year, role }: { db: DatabaseSync; tenant: string; year: number; role: Role }) {
  const draft = reportDraft(db,tenant,year);
  const latest = db.prepare('SELECT version,status FROM reports WHERE tenant=? AND year=? ORDER BY version DESC LIMIT 1')
    .get(tenant,year);
  const latestRef = latest ? year + '/' + latest.version : '';
  const externalReceipt = readRecords(db,tenant,'submission').some(entry => entry.data.report === latestRef && entry.data.event === 'receipt');
  const next = latest?.status === 'review' ? 'Open version awaiting committee review'
    : latest?.status === 'approved' ? 'Open version awaiting sign-off'
    : latest?.status === 'signed' ? (externalReceipt ? 'Review filing outcome' : 'Record external receipt')
    : draft.blockers.length ? 'View reporting blockers'
    : ['owner','sdf'].includes(role) ? 'Request committee review' : 'Open reporting';
  const target = latest?.status === 'signed' && (sections.submission.roles as readonly Role[]).includes(role) ? 'submission' : 'reports';
  return <div className="report-progress">
    <h3>Reporting cycle {year}</h3>
    <p>{latest ? 'Version ' + latest.version + ' · ' + latest.status : 'Working draft'} · {draft.blockers.length} working draft blockers · {draft.warnings.length} warnings</p>
    <Link href={'?tab=' + target + '&year=' + year}>{target === 'submission' || latest?.status !== 'signed' ? next : 'Open signed report'}</Link>
  </div>;
}

export default async function CompanyWorkspace({ params, searchParams }: {
  params: Promise<{tenant:string}>; searchParams: Promise<{tab?:string;year?:string}>;
}) {
  const actor = await requireActor();
  const { tenant } = await params;
  const db = localDb();
  const role = roleFor(db,actor,tenant);
  const company = db.prepare('SELECT name,seta,sdl,parent_id FROM tenants WHERE id=?').get(tenant);
  if (!role || !company) notFound();
  const {tab = 'overview',year: rawYear} = await searchParams;
  const year = rawYear && /^20\d\d$/.test(rawYear) && rawYear !== '2099' ? Number(rawYear) : new Date().getFullYear();
  const reports = (reportRoles as readonly Role[]).includes(role);
  const evidence = ['owner','sdf','training','committee','signatory','finance'].includes(role);
  const links: [string,string][] = [['overview','Overview']];
  for (const kind of Object.keys(sections)) {
    if (isRecordKind(kind) && canView(kind,role)) links.push([kind,sections[kind].label]);
  }
  if (reports) links.push(['reports','Reporting and approvals']);
  if (evidence) links.push(['evidence','Evidence']);
  if (['owner','sdf'].includes(role)) links.push(['support','Support']);
  if (role === 'owner') links.push(['access','Company and access']);
  if (!links.some(([key]) => key === tab)) notFound();

  const reportYear = '&year=' + year;
  const parents = db.prepare(`SELECT t.id,t.name FROM tenants t JOIN membership m ON m.tenant=t.id
    WHERE m.user_id=? AND m.role='owner' AND t.id<>? ORDER BY t.name`).all(actor.id,tenant);
  return <WorkspaceShell title={String(company.name)} subtitle={'Company workspace · ' + role + ' access'}>
    <nav className="workspace-nav" aria-label="Company modules">
      {links.map(([key,label]) => <Link key={key} href={'?tab=' + key + reportYear} aria-current={tab === key ? 'page' : undefined}>{label}</Link>)}
    </nav>
    {tab === 'overview' && <section className="workspace-panel">
      <h2>Company dashboard</h2>
      {reports && <ReportingProgress db={db} tenant={tenant} year={year} role={role}/>}
      <dl className="workspace-metrics">
        {(['employee','mapping','gap','plan','training'] as const).map(kind => <div key={kind}>
          <dt>{sections[kind].label}</dt><dd>{readRecords(db,tenant,kind).length}</dd>
        </div>)}
      </dl>
      {['owner','finance'].includes(role) && <><h3>Commercial status</h3>
        <Table columns={['Type','Name','Status','Amount']} rows={db.prepare('SELECT * FROM commercial WHERE tenant=? ORDER BY type,name')
          .all(tenant).map(row => [String(row.type),String(row.name),String(row.status),rand.format(Number(row.cents) / 100)])}/></>}
      {role === 'owner' && <details><summary>Company audit activity</summary>
        <Table columns={['Action','Actor','Detail','Time']} rows={db.prepare(`SELECT a.action,u.name,a.subject,a.created_at
          FROM audit a LEFT JOIN users u ON a.user_id=u.id WHERE a.tenant=? ORDER BY a.id DESC LIMIT 50`)
          .all(tenant).map(row => [String(row.action),String(row.name ?? ''),String(row.subject),String(row.created_at)])}/>
      </details>}
    </section>}
    {isRecordKind(tab) && <RecordsPanel db={db} tenant={tenant} role={role} kind={tab}/>}
    {tab === 'reports' && <ReportPanel db={db} tenant={tenant} year={year} role={role} actorId={actor.id}/>}
    {tab === 'evidence' && <EvidencePanel db={db} tenant={tenant} role={role}/>}
    {tab === 'support' && <section className="workspace-panel">
      <h2>Support requests</h2>
      <Table columns={['Subject','Description','Status']} rows={db.prepare('SELECT * FROM support WHERE tenant=? ORDER BY created_at DESC')
        .all(tenant).map(row => [String(row.title),String(row.detail),String(row.status)])}/>
      <LocalForm fields={{task:'support',tenant}} label="Open support request">
        <Input name="title" label="Subject"/>
        <Input name="detail" label="Description"/>
      </LocalForm>
    </section>}
    {tab === 'access' && <section className="workspace-panel">
      <h2>Company profile</h2>
      <LocalForm fields={{task:'profile',tenant}} label="Save company profile">
        <Input name="sdl" label="SDL reference" value={String(company.sdl)}/>
        <Input name="seta" label="SETA" value={String(company.seta)}/>
        <Select name="parent" label="Parent company" optional value={String(company.parent_id ?? '')}
          choices={parents.map(row => [String(row.id),String(row.name)])}/>
      </LocalForm>
      <h3>Team members and SDF appointments</h3>
      <Table columns={['Team member','Email','Role','Expiry']} rows={db.prepare(`SELECT u.name,u.email,m.role,m.expires
        FROM membership m JOIN users u ON m.user_id=u.id WHERE m.tenant=? ORDER BY u.name`).all(tenant)
        .map(row => [String(row.name),String(row.email),String(row.role),String(row.expires ?? '—').slice(0,10)])}/>
      <LocalForm fields={{task:'membership',tenant}} label="Invite, appoint or update access">
        <Input name="email" label="Verified local account email" type="email"/>
        <Select name="role" label="Role or action" choices={['hr','training','finance','committee','signatory','sdf','revoke'].map(item => [item,item])}/>
        <Input name="expiry" label="SDF appointment expiry" type="date" optional/>
      </LocalForm>
    </section>}
  </WorkspaceShell>;
}
