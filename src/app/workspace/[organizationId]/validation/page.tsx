import Link from 'next/link';
import {requireOrgWorkspace} from '@/lib/workspace/access';
export const dynamic='force-dynamic';
const allowed=['company_admin','executive','hr_admin','training_admin','sdf','committee_member','signatory','auditor'];
type Check={title:string;details:string;passed:boolean;route:string};
export default async function ReportingReadiness({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 if(!roles.some(role=>allowed.includes(role)))return <section>
  <h2 className="workspace-section-title">Reporting readiness</h2>
  <p className="notice">You do not have access to company reporting reviews.</p>
 </section>;
 const [cycleResult,wspResult,atrResult,taskResult,profileResult]=await Promise.all([
  client.from('reporting_cycles').select('id,reporting_year,status').eq('organization_id',organizationId).order('reporting_year',{ascending:false}).limit(15),
  client.from('wsp_plan_items').select('cycle_id,status').eq('organization_id',organizationId).limit(5000),
  client.from('atr_records').select('cycle_id,evidence_state,status').eq('organization_id',organizationId).limit(5000),
  client.from('workflow_tasks').select('id,status').eq('organization_id',organizationId).neq('status','completed').limit(5000),
  client.from('organization_compliance_profiles').select('profile_status,sdl_number,seta_name').eq('organization_id',organizationId).maybeSingle(),
 ]);
 if([cycleResult,wspResult,atrResult,taskResult,profileResult].some(r=>r.error)){
  return <section><h2 className="workspace-section-title">Reporting readiness</h2>
   <p className="notice" role="alert">Some records could not be loaded. No readiness assessment can be shown.</p>
  </section>;
 }
 const cycles=cycleResult.data??[];
 const plans=wspResult.data??[];
 const actuals=atrResult.data??[];
 const tasks=taskResult.data??[];
 const profile=profileResult.data;
 return <section>
  <h2 className="workspace-section-title">Internal reporting readiness</h2>
  <p className="workspace-caption">General data preparation checks only. They do not determine SETA eligibility, regulatory compliance, funding or filing acceptance.</p>
  {!cycles.length&&<p className="notice">Create a reporting year to begin reviewing WSP and ATR working records.</p>}
  {cycles.map(cycle=>{
   const cyclePlans=plans.filter(p=>p.cycle_id===cycle.id);
   const cycleActuals=actuals.filter(a=>a.cycle_id===cycle.id);
   const checks:Check[]=[
    {title:'Company details',details:profile?.profile_status==='verified'?'Profile marked verified':'Company details have not been independently verified',passed:profile?.profile_status==='verified',route:'company'},
    {title:'WSP planning',details:cyclePlans.length+' planned training line(s)',passed:cyclePlans.length>0,route:'wsp'},
    {title:'ATR evidence',details:cycleActuals.length+' ATR line(s); '+cycleActuals.filter(a=>a.evidence_state!=='verified').length+' awaiting evidence verification',passed:cycleActuals.length>0 && cycleActuals.every(a=>a.evidence_state==='verified'),route:'atr'},
    {title:'Assigned work',details:tasks.length+' open or blocked task(s) in this organisation',passed:tasks.length===0,route:'tasks'},
   ];
   return <article className="workspace-readiness" key={cycle.id}>
    <div><h3>Reporting year {cycle.reporting_year}</h3><p className="workspace-caption">Workflow stage: {cycle.status.replaceAll('_',' ')}</p></div>
    <div className="workspace-check-grid">
    {checks.map(check=><div className="workspace-check" key={check.title}>
     <strong>{check.passed?'✓':'○'} {check.title}</strong><p>{check.details}</p>
     <Link href={'/workspace/'+organizationId+'/'+check.route} className="text-link">Review section →</Link>
    </div>)}
    </div>
   </article>;
  })}
  <p className="notice">Official SETA templates, deadlines, validation, and submission exports remain unavailable until a verified SETA adapter and reporting year are approved.</p>
 </section>;
}
