import {requireOrgWorkspace} from '@/lib/workspace/access';
import ComplianceProfileForm from '@/components/ComplianceProfileForm';
export const dynamic='force-dynamic';
export default async function CompanyCompliance({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 const permitted=roles.some(r=>['company_admin','executive','hr_admin','sdf','auditor'].includes(r));
 if(!permitted)return <p className="notice">Company compliance details are restricted to authorised staff.</p>;
 const {data:profile,error}=await client.from('organization_compliance_profiles')
   .select('registration_number,sdl_number,seta_name,industry,profile_status,updated_at')
   .eq('organization_id',organizationId).maybeSingle();
 const canEdit=roles.some(r=>['company_admin','hr_admin'].includes(r));
 return <section>
  <h2 className="workspace-section-title">Company &amp; SDL profile</h2>
  <p className="workspace-caption">Maintain company registration details and its provisional SETA association. Nothing here verifies an employer with SARS or a SETA.</p>
  {error?<p className="notice" role="alert">Unable to load profile.</p>:
    canEdit?<ComplianceProfileForm organizationId={organizationId} profile={profile}/>:
      <dl className="workspace-details"><dt>Registration number</dt><dd>{profile?.registration_number||'Not captured'}</dd>
      <dt>SDL reference</dt><dd>{profile?.sdl_number||'Not captured'}</dd>
      <dt>SETA</dt><dd>{profile?.seta_name||'Undecided'}</dd>
      <dt>Profile status</dt><dd>{profile?.profile_status||'Draft'}</dd></dl>}
 </section>;
}
