import {requirePlatformOperator} from '@/lib/ops/access';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import OperatorApproveForm from '@/components/OperatorApproveForm';
export const dynamic='force-dynamic';
export const metadata={robots:'noindex,nofollow'};

export default async function EmployerApplications(){
 await requirePlatformOperator();
 if(process.env.IMBHOLA_OPERATOR_APPROVALS_ENABLED!=='true'){
  return <main className="container section"><h1 className="inner-title">Imbhola operations</h1>
    <p className="notice">Company approval is disabled until the operator security review is complete.</p></main>;
 }
 const admin=createSupabaseAdminClient();
 const {data,error}=await admin.from('organization_applications')
  .select('id,legal_name,registration_number,contact_email,created_at,status')
  .eq('status','pending').order('created_at',{ascending:true}).limit(30);
 return <main className="container section">
  <div className="eyebrow">RESTRICTED IMBHOLA OPERATIONS</div>
  <h1 className="inner-title">Employer verification queue.</h1>
  <p className="lead">Approve applicants only after independent identity, company and authority checks. Every approval is audited.</p>
  {error?<p className="notice">Applications could not be loaded.</p>:
   !data?.length?<p className="notice">No pending applications.</p>:
   data.map(app=><article className="card" key={app.id}>
    <h3>{app.legal_name}</h3>
    <p>Registration reference: {app.registration_number||'Not supplied'}</p>
    <p>Verified account email: {app.contact_email}</p>
    <p>Submitted: {app.created_at.slice(0,10)}</p>
    <OperatorApproveForm applicationId={app.id}/>
   </article>)}
 </main>;
}
