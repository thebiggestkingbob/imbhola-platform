import Link from 'next/link';
import { notFound } from 'next/navigation';
import LocalForm from '@/components/LocalForm';
import { Input, Select, Table, WorkspaceShell, rand } from '@/components/LocalUI';
import { localDb } from '@/local/db';
import { requireActor } from '@/local/session';

export default async function AdminPage() {
  const actor = await requireActor();
  if (actor.kind !== 'operations') notFound();
  const db = localDb();
  const companies = db.prepare(`SELECT t.id,t.name,t.seta,
    (SELECT COUNT(*) FROM membership WHERE tenant=t.id) AS members FROM tenants t ORDER BY t.name`).all();
  const entries = db.prepare(`SELECT c.*,t.name AS company FROM commercial c JOIN tenants t ON t.id=c.tenant
    ORDER BY t.name,c.type,c.name`).all();
  const unverified = db.prepare('SELECT id,name,email,kind FROM users WHERE verified_at IS NULL ORDER BY name').all();
  const consultants = db.prepare(`SELECT u.name AS consultant,t.name AS company,m.expires FROM users u
    LEFT JOIN membership m ON m.user_id=u.id AND m.role='sdf' LEFT JOIN tenants t ON t.id=m.tenant
    WHERE u.kind='sdf' ORDER BY u.name,t.name`).all();
  const leads = db.prepare(`SELECT l.*,EXISTS(SELECT 1 FROM audit WHERE action='lead.reviewed' AND subject=l.id) AS reviewed
    FROM leads l ORDER BY l.created_at DESC`).all();
  const support = db.prepare(`SELECT s.*,t.name AS company FROM support s JOIN tenants t ON t.id=s.tenant
    ORDER BY s.created_at DESC`).all();
  const reportingSources = db.prepare(`SELECT s.*,u.name AS recorder FROM reporting_sources s
    JOIN users u ON u.id=s.recorded_by ORDER BY s.reporting_year DESC,s.recorded_at DESC`).all();
  const types = ['subscription','managed contract','invoice'];
  const statuses = ['draft','active','suspended','ended','issued','paid','void'];
  const fields = (row?: typeof entries[number]) => <>
    <Select name="type" label="Type" value={String(row?.type ?? '')} choices={types.map(type => [type,type])}/>
    <Input name="name" label="Name" value={row ? String(row.name) : undefined}/>
    <Input name="amount" label="Amount in rand" type="number" value={row ? (Number(row.cents) / 100).toFixed(2) : undefined}/>
    <Select name="status" label="Status" value={String(row?.status ?? '')} choices={statuses.map(status => [status,status])}/>
    <Input name="reference" label="Reference" value={row ? String(row.reference) : undefined}/>
  </>;
  return <WorkspaceShell title="Imbhola administration" subtitle="Manage synthetic tenants, enquiries, consultants and commercial records.">
    <section className="workspace-panel"><h2>Operations dashboard</h2>
      <dl className="workspace-metrics">
        <div><dt>Companies</dt><dd>{companies.length}</dd></div>
        <div><dt>Unreviewed enquiries</dt><dd>{leads.filter(row => !row.reviewed).length}</dd></div>
        <div><dt>Accounts awaiting verification</dt><dd>{unverified.length}</dd></div>
        <div><dt>Active plans and contracts</dt><dd>{entries.filter(row => row.status === 'active').length}</dd></div>
      </dl>
      <Table columns={['Company','SETA','Members']} rows={companies.map(row => [String(row.name),String(row.seta),String(row.members)])}/>
    </section>
    <section className="workspace-panel"><h2>Account verification and consultants</h2>
      <Table columns={['Name','Email','Action']} rows={unverified.map(row => [String(row.name),String(row.email),
        <LocalForm key="verify" fields={{task:'verify',id:String(row.id)}} label="Verify synthetic account"/>,
      ])}/>
      <h3>SDF appointments</h3>
      <Table columns={['Consultant','Company','Expiry']} rows={consultants.map(row => [String(row.consultant),String(row.company ?? 'Unappointed'),String(row.expires ?? '').slice(0,10)])}/>
    </section>
    <section className="workspace-panel"><h2>Enquiry and demo requests</h2>
      <Table columns={['Name','Company','Email','Request','Consent version','Status']} rows={leads.map(row => [
        String(row.name),String(row.company),String(row.email),String(row.purpose),String(row.consent_version),
        row.reviewed ? 'Reviewed' : <LocalForm key="lead" fields={{task:'leadStatus',id:String(row.id)}} label="Mark reviewed"/>,
      ])}/>
    </section>
    <section className="workspace-panel"><h2>Subscriptions, contracts and invoices</h2>
      <Table columns={['Company','Type','Name','Amount','Status','Reference','Edit']} rows={entries.map(row => [
        String(row.company),String(row.type),String(row.name),rand.format(Number(row.cents) / 100),String(row.status),String(row.reference),
        <details key="edit"><summary>Edit commercial record</summary>
          <LocalForm fields={{task:'commercial',tenant:String(row.tenant),id:String(row.id)}} label="Save changes">{fields(row)}</LocalForm>
        </details>,
      ])}/>
      <details><summary>Add commercial record</summary><LocalForm fields={{task:'commercial'}} label="Add commercial record">
        <Select name="tenant" label="Company" choices={companies.map(row => [String(row.id),String(row.name)])}/>
        {fields()}
      </LocalForm></details>
    </section>
    <section className="workspace-panel"><h2>Support queue</h2>
      <Table columns={['Company','Subject','Description','Status']} rows={support.map(row => [
        String(row.company),String(row.title),String(row.detail),row.status === 'resolved' ? 'Resolved' :
          <LocalForm key="resolve" fields={{task:'resolveSupport',tenant:String(row.tenant),id:String(row.id)}} label="Resolve request"/>,
      ])}/>
    </section>
    <section className="workspace-panel"><h2>Reporting rules</h2>
      <Table columns={['Rules','Version','Status']} rows={[
        ['Internal development checks','local-synthetic-v1','Active for synthetic data'],
        ['Services SETA workbook and PDF','Pending independent verification','Disabled'],
      ]}/>
      <h3>Services SETA source register</h3>
      <p>Record the exact published files and revisions used during review. Official exports require a separate independent verification.</p>
      <p><Link href="https://servicesseta.org.za/employers/">Find published mandatory grant documents</Link></p>
      <Table columns={['Reporting year','Document','Revision','SHA-256','Recorded by']} rows={reportingSources.map(row => [
        String(row.reporting_year),<Link key="document" href={String(row.url)}>{String(row.title)}</Link>,String(row.revision),
        <code key="checksum" className="report-digest">{String(row.sha256)}</code>,String(row.recorder),
      ])}/>
      <details><summary>Record a source revision</summary>
        <LocalForm fields={{task:'reportingSource'}} label="Record source">
          <Input name="year" label="Reporting year"/>
          <Input name="title" label="Document title"/>
          <Input name="revision" label="Published revision"/>
          <Input name="url" label="Published document link" type="url"/>
          <Input name="sha256" label="SHA-256 checksum"/>
        </LocalForm>
      </details>
    </section>
  </WorkspaceShell>;
}
