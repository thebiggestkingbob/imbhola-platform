import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Table, WorkspaceShell } from '@/components/LocalUI';
import { localDb, now } from '@/local/db';
import { requireActor } from '@/local/session';

export default async function SdfPage() {
  const actor = await requireActor();
  if (actor.kind !== 'sdf') notFound();
  const companies = localDb().prepare(`SELECT t.id,t.name,m.expires,
    (SELECT status FROM reports WHERE tenant=t.id ORDER BY year DESC,version DESC LIMIT 1) AS latest
    FROM membership m JOIN tenants t ON t.id=m.tenant WHERE m.user_id=? AND m.role='sdf' AND m.expires>?
    ORDER BY t.name`).all(actor.id,now());
  return <WorkspaceShell title="SDF client workspace" subtitle="Open a company covered by an active appointment.">
    <section className="workspace-panel">
      <h2>Client appointments</h2>
      <Table columns={['Company','Appointment ends','Latest report']} rows={companies.map(company => [
        <Link key="link" href={'/workspace/' + company.id}>{String(company.name)}</Link>,
        String(company.expires).slice(0,10),String(company.latest ?? 'No report'),
      ])}/>
    </section>
  </WorkspaceShell>;
}
