import Link from 'next/link';
import {requireOrgWorkspace} from '@/lib/workspace/access';
import {SERVICES_SETA_PILOT,SERVICES_SETA_PILOT_CHECKS} from '@/lib/seta/services-pilot';
export const dynamic='force-dynamic';
const allowed=['company_admin','executive','hr_admin','training_admin','sdf','committee_member','signatory','auditor'];
export default async function ServicesSetaPilot({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 if(!roles.some(r=>allowed.includes(r)))return <section><h2 className="workspace-section-title">Services SETA pilot</h2><p className="notice">Only authorised reporting team members may review this material.</p></section>;
 const [{data:profile},{data:cycles}]=await Promise.all([
  client.from('organization_compliance_profiles').select('sdl_number,seta_name,profile_status').eq('organization_id',organizationId).maybeSingle(),
  client.from('reporting_cycles').select('id,reporting_year,status').eq('organization_id',organizationId).order('reporting_year',{ascending:false}).limit(10),
 ]);
 return <section>
  <div className="eyebrow">FIRST SETA · SOURCE REVIEW</div>
  <h2 className="workspace-section-title">Services SETA 2026–27 pilot</h2>
  <p className="workspace-caption">Preparation checklist grounded in public Services SETA employer resources and the inspected 2026–27 declaration form. The official employee workbook and code sheet are not yet mapped or verified.</p>
  <p className="notice">This employer must be confirmed as actually registered with Services SETA. These checks do not authorise or simulate submission. Official export remains unavailable.</p>
  <h3>Organisation reporting context</h3>
  <dl className="workspace-details">
    <dt>SETA (company-provided)</dt><dd>{profile?.seta_name||'Not captured'}</dd>
    <dt>SDL reference</dt><dd>{profile?.sdl_number?'On file (unverified)':'Not captured'}</dd>
    <dt>Profile status</dt><dd>{profile?.profile_status||'Not created'}</dd>
    <dt>Reporting cycles</dt><dd>{cycles?.length??0} recorded</dd>
  </dl>
  <h3>Documents to verify in the pilot</h3>
  <div className="workspace-check-grid">{SERVICES_SETA_PILOT_CHECKS.map(check=><article className="workspace-check" key={check.key}>
    <strong>{check.label}</strong>
    <p>Required preparation item · source: {check.source.replaceAll('-',' ')}</p>
  </article>)}</div>
  <h3>Official source registry</h3>
  <div className="workspace-table-scroll"><table className="workspace-table">
  <thead><tr><th>Document</th><th>Review status</th><th>Official source</th></tr></thead>
  <tbody>{SERVICES_SETA_PILOT.sources.map(s=><tr key={s.id}>
    <td>{s.label}</td><td>{s.review.replaceAll('-',' ')}</td>
    <td><Link className="text-link" href={s.url} target="_blank" rel="noopener noreferrer">Open original</Link></td>
  </tr>)}</tbody></table></div>
  <p className="notice">No employee information is collected on this page. The checklist is not a signed declaration, legal opinion, source-of-truth verification, or official SETA readiness certificate.</p>
 </section>;
}
