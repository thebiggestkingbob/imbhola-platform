import {requireOrgWorkspace} from '@/lib/workspace/access';
import WorkforcePreviewForm from '@/components/WorkforcePreviewForm';
export const dynamic='force-dynamic';
export default async function WorkforceImport({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;
 const {roles}=await requireOrgWorkspace(organizationId);
 const permitted=roles.some(r=>['company_admin','hr_admin','sdf'].includes(r));
 const enabled=process.env.IMBHOLA_WORKFORCE_PREVIEW_ENABLED==='true';
 return <section>
  <h2 className="workspace-section-title">Workforce import</h2>
  <p className="workspace-caption">CSV fields: employee_code, given_name, family_name, job_title, department, status, ofo_code. Required: employee_code, given_name and family_name.</p>
  {!permitted?<p className="notice">Only approved company administrators, HR administrators and SDFs may preview workforce imports.</p>:
   !enabled?<p className="notice">Employee-file uploads are disabled until POPIA and data-transfer safeguards have been approved. Do not upload real workforce information.</p>:
   <WorkforcePreviewForm organizationId={organizationId}/>}
  <p className="notice">No payroll system integration or employee snapshot commit is currently enabled. OFO codes are format-checked only; official occupation mappings still require verified source data.</p>
 </section>;
}
