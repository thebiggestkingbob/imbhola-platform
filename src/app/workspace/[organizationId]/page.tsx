import Link from 'next/link';
import { requireOrgWorkspace } from '@/lib/workspace/access';

export const dynamic = 'force-dynamic';

export default async function WorkspaceOverview({ params }: {
  params: Promise<{ organizationId: string }>
}) {
  const { organizationId } = await params;
  const { client } = await requireOrgWorkspace(organizationId);
  const [cycles, programmes, events, tasks] = await Promise.all([
    client.from('reporting_cycles').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    client.from('training_programs').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    client.from('training_events').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    client.from('workflow_tasks').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).neq('status', 'completed'),
  ]);
  const measures = [
    ['Reporting years', cycles.count, 'reporting'],
    ['Training programmes', programmes.count, 'training'],
    ['Training events', events.count, 'training-events'],
    ['Open tasks', tasks.count, 'tasks'],
  ] as const;
  return <section aria-labelledby="workspace-overview">
    <h2 id="workspace-overview" className="workspace-section-title">Organisation overview</h2>
    <p className="workspace-caption">Live records only. Counts are scoped to your authorised organisation.</p>
    <div className="workspace-metrics">{measures.map(([label,count,route]) =>
      <Link className="workspace-metric" key={route} href={'/workspace/'+organizationId+'/'+route}>
        <span>{label}</span><strong>{count ?? '—'}</strong>
        <small>{count === null ? 'Unavailable' : 'Open section →'}</small>
      </Link>
    )}</div>
    <p className="notice">Reporting, grants and official SETA templates are not yet production-ready. No official exports or submissions are enabled.</p>
  </section>;
}
