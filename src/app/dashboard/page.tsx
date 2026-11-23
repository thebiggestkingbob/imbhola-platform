import Link from 'next/link';
import { redirect } from 'next/navigation';
import LocalForm from '@/components/LocalForm';
import { Input, Table, WorkspaceShell } from '@/components/LocalUI';
import { localDb, now } from '@/local/db';
import { requireActor } from '@/local/session';

export default async function Dashboard() {
  const actor = await requireActor();
  if (actor.kind === 'sdf') redirect('/sdf');
  if (actor.kind === 'operations') redirect('/admin');
  const companies = localDb().prepare(`SELECT t.id,t.name,m.role FROM membership m JOIN tenants t ON t.id=m.tenant
    WHERE m.user_id=? AND (m.expires IS NULL OR m.expires>?) ORDER BY t.name`).all(actor.id,now());
  const invitations = localDb().prepare(`SELECT t.id,t.name,i.role FROM invitations i JOIN tenants t ON t.id=i.tenant
    WHERE i.user_id=? AND i.expires>? ORDER BY t.name`).all(actor.id,now());
  return <WorkspaceShell title="Employer workspaces" subtitle={'Signed in as ' + actor.name} items={[{key:'overview',label:'Overview',href:'/dashboard'},{key:'companies',label:'Companies',href:'#companies'}]} action={<Link className="button" href="#create-company">Create company</Link>}>
    <dl className="workspace-metrics dashboard-metrics">
      <div><dt>Companies you can access</dt><dd>{companies.length}</dd></div>
      <div><dt>Pending invitations</dt><dd>{invitations.length}</dd></div>
    </dl>
    <section id="companies" className="workspace-panel">
      <h2>Your companies</h2>
      <Table columns={['Company','Role']} rows={companies.map(company => [
        <Link key="link" href={'/workspace/' + company.id}>{String(company.name)}</Link>,String(company.role),
      ])}/>
    </section>
    {!!invitations.length && <section className="workspace-panel"><h2>Company invitations</h2>
      <Table columns={['Company','Role','Action']} rows={invitations.map(row => [
        String(row.name),String(row.role),
        <LocalForm key="accept" fields={{task:'acceptInvitation',tenant:String(row.id)}} label="Accept invitation"/>,
      ])}/>
    </section>}
    <section className="workspace-panel" id="create-company"><h2>Create a company</h2>
      <LocalForm fields={{task:'create'}} label="Create company"><Input name="name" label="Synthetic company name"/></LocalForm>
    </section>
  </WorkspaceShell>;
}
