import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Status, Table, WorkspaceShell } from '@/components/LocalUI';
import { localDb, now } from '@/local/db';
import { requireActor } from '@/local/session';

export default async function SdfPage() {
  const actor = await requireActor();
  if (actor.kind !== 'sdf') notFound();
  const companies = localDb().prepare(`SELECT t.id,t.name,m.expires,
    (SELECT status FROM reports WHERE tenant=t.id ORDER BY year DESC,version DESC LIMIT 1) AS latest
    FROM membership m JOIN tenants t ON t.id=m.tenant WHERE m.user_id=? AND m.role='sdf' AND m.expires>?
    ORDER BY t.name`).all(actor.id,now());
  return <WorkspaceShell title="SDF client workspace" subtitle="Open a company covered by an active appointment." homeHref="/sdf" items={[{key:'overview',label:'Overview',href:'/sdf'},{key:'companies',label:'Clients',href:'#clients'}]}>
    <dl className="workspace-metrics dashboard-metrics">
      <div><dt>Active appointments</dt><dd>{companies.length}</dd></div>
      <div><dt>Reports in review</dt><dd>{companies.filter(company => company.latest === 'review').length}</dd></div>
    </dl>
    <section className="workspace-panel" id="clients">
      <h2>Client appointments</h2>
      <Table columns={['Company','Appointment ends','Latest report']} rows={companies.map(company => [
        <Link key="link" href={'/workspace/' + company.id}>{String(company.name)}</Link>,
        String(company.expires).slice(0,10),<Status key="status" value={String(company.latest ?? 'No report')}/>,
      ])}/>
    </section>
  </WorkspaceShell>;
}
