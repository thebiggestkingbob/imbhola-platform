import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireOrgWorkspace } from '@/lib/workspace/access';
import { WORKSPACE_SECTIONS, isWorkspaceSection } from '@/lib/workspace/sections';
import TrainingProgramForm from '@/components/TrainingProgramForm';
import WorkspaceDraftForm from '@/components/WorkspaceDraftForm';
import ReviewCycleControls from '@/components/ReviewCycleControls';
import { completeTrainingEvent } from '@/lib/workspace/draft-actions';

export const dynamic = 'force-dynamic';
function isWorkspaceDraftSection(s:string):s is 'reporting'|'training-events'|'wsp'|'atr'|'tasks' {
  return ['reporting','training-events','wsp','atr','tasks'].includes(s);
}

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
    .select('id,' + config.columns.map(c => c.key).join(','))
    .eq('organization_id',organizationId)
    .limit(100);

  const rows = (records ?? []) as unknown as Array<Record<string, unknown>>;
  const canEdit = roles.some(r => ['company_admin','hr_admin','training_admin','sdf'].includes(r));
  const canManageTraining = section === 'training' && canEdit;
  const draftSection = ['reporting','training-events','wsp','atr','tasks'].includes(section);
  const canManageDraft = canEdit && draftSection && (section !== 'reporting' || roles.some(r=>['company_admin','hr_admin','sdf'].includes(r)));
  const [programResult, cycleResult, eventResult] = canManageDraft ? await Promise.all([
    client.from('training_programs').select('id,title').eq('organization_id',organizationId).order('title').limit(100),
    client.from('reporting_cycles').select('id,reporting_year').eq('organization_id',organizationId).eq('status','draft').order('reporting_year',{ascending:false}).limit(25),
    client.from('training_events').select('id,event_date').eq('organization_id',organizationId).eq('status','completed').order('event_date',{ascending:false}).limit(100),
  ]) : [{data:[]},{data:[]},{data:[]}];
  const programs = (programResult.data || []).map(p=>({id:p.id,label:p.title}));
  const cycles = (cycleResult.data || []).map(c=>({id:c.id,label:String(c.reporting_year)}));
  const events = (eventResult.data || []).map(e=>({id:e.id,label:e.event_date}));

  return <section aria-labelledby="section-title">
    <h2 className="workspace-section-title" id="section-title">{config.label}</h2>
    <p className="workspace-caption">{config.summary}</p>
    {(section==='wsp'||section==='atr') && roles.some(r=>['company_admin','executive','hr_admin','training_admin','sdf','signatory','auditor'].includes(r)) && <p className="workspace-caption"><Link className="text-link" href={'/api/workspace/'+organizationId+'/draft-export?type='+section}>Export internal working draft (.csv) →</Link> · Not an official SETA template.</p>}
    {canManageTraining && <TrainingProgramForm organizationId={organizationId}/>}
    {canManageDraft && isWorkspaceDraftSection(section) && <WorkspaceDraftForm organizationId={organizationId} section={section} programs={programs} cycles={cycles} events={events}/>}
    
    {error ? <p className="notice" role="alert">This section could not be loaded. Your role may not have access, or the service may be unavailable.</p> :
      !rows.length ? <p className="notice">No authorised records are available in this section yet.</p> :
      <div className="workspace-table-scroll"><table className="workspace-table">
        <thead><tr>{config.columns.map(c=><th key={c.key} scope="col">{c.label}</th>)}{section==='training-events' && canEdit && <th scope="col">Action</th>}</tr></thead>
        <tbody>{rows.map((record,index)=><tr key={index}>{config.columns.map(c=>
          <td key={c.key}>{readable((record as unknown as Record<string,unknown>)[c.key])}</td>
        )}{section==='training-events' && canEdit && <td>{(record as unknown as {status?:string;id?:string}).status==='draft' && typeof (record as unknown as {id?:string}).id==='string' ?
          <form action={completeTrainingEvent.bind(null,organizationId,String((record as unknown as {id?:string}).id))}>
            <button type="submit" className="workspace-mini-button">Mark completed</button>
          </form> : '—'}</td>}</tr>)}</tbody>
      </table></div>}
    {section==='reporting' && rows && <div className="workspace-review-list">
      {rows.map(r => <ReviewCycleControls key={String(r.id)}
        organizationId={organizationId}
        cycleId={String((r as unknown as {id:string}).id)}
        reportingYear={Number(r.reporting_year)}
        status={String(r.status)} roles={roles}/>)}
    </div>}
    {rows && rows.length===100 && <p className="workspace-caption">Showing first 100 records. Pagination will be added before pilot use.</p>}
  </section>;
}
