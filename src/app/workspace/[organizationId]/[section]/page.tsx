import { notFound } from 'next/navigation';
import { requireOrgWorkspace } from '@/lib/workspace/access';
import { WORKSPACE_SECTIONS, isWorkspaceSection } from '@/lib/workspace/sections';
import TrainingProgramForm from '@/components/TrainingProgramForm';

export const dynamic = 'force-dynamic';

function readable(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString('en-ZA');
  if (typeof value === 'string') return value.replaceAll('_', ' ');
  return '—';
}

export default async function WorkspaceSectionPage({ params }: {
  params: Promise<{ organizationId: string; section: string }>
}) {
  const { organizationId, section } = await params;
  if (!isWorkspaceSection(section)) notFound();
  const { client, roles } = await requireOrgWorkspace(organizationId);
  const config = WORKSPACE_SECTIONS[section];
  // Table and fields come exclusively from a server-owned allowlist.
  const { data: records, error } = await client
    .from(config.table)
    .select(config.columns.map(c => c.key).join(','))
    .eq('organization_id',organizationId)
    .limit(100);

  const canManageTraining = section === 'training' &&
    roles.some(r => ['company_admin','hr_admin','training_admin','sdf'].includes(r));

  return <section aria-labelledby="section-title">
    <h2 className="workspace-section-title" id="section-title">{config.label}</h2>
    <p className="workspace-caption">{config.summary}</p>
    {canManageTraining && <TrainingProgramForm organizationId={organizationId}/>}
    {error ? <p className="notice" role="alert">This section could not be loaded. Your role may not have access, or the service may be unavailable.</p> :
      !records?.length ? <p className="notice">No authorised records are available in this section yet.</p> :
      <div className="workspace-table-scroll"><table className="workspace-table">
        <thead><tr>{config.columns.map(c=><th key={c.key} scope="col">{c.label}</th>)}</tr></thead>
        <tbody>{records.map((record,index)=><tr key={index}>{config.columns.map(c=>
          <td key={c.key}>{readable((record as unknown as Record<string,unknown>)[c.key])}</td>
        )}</tr>)}</tbody>
      </table></div>}
    {records && records.length===100 && <p className="workspace-caption">Showing first 100 records. Pagination will be added before pilot use.</p>}
  </section>;
}
