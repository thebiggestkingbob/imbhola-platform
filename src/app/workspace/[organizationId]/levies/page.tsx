import {requireOrgWorkspace} from '@/lib/workspace/access';
import LevyRecordForm from '@/components/LevyRecordForm';
export const dynamic='force-dynamic';
export default async function Levies({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 if(!roles.some(r=>['company_admin','executive','hr_admin','sdf','auditor'].includes(r)))
 return <p className="notice">Levy records are restricted to authorised staff.</p>;
 const [cycleResult,levyResult]=await Promise.all([
  client.from('reporting_cycles').select('id,reporting_year').eq('organization_id',organizationId).order('reporting_year',{ascending:false}).limit(30),
  client.from('levy_payment_records').select('id,levy_month,amount_paid,payment_reference,verification_status').eq('organization_id',organizationId).order('levy_month',{ascending:false}).limit(150),
 ]);
 return <section>
  <h2 className="workspace-section-title">SDL payment records</h2>
  <p className="workspace-caption">Manual records only. Payment confirmation, grant calculations and eligibility are not verified by this screen.</p>
  {roles.some(r=>['company_admin','hr_admin'].includes(r))&&<LevyRecordForm organizationId={organizationId}
    cycles={(cycleResult.data||[]).map(c=>({id:c.id,year:c.reporting_year}))}/>}
  {levyResult.error?<p className="notice" role="alert">Unable to load levy records.</p>:
    !levyResult.data?.length?<p className="notice">No monthly levy payments are recorded yet.</p>:
    <div className="workspace-table-scroll"><table className="workspace-table">
      <thead><tr><th>Month</th><th>Amount (ZAR)</th><th>Reference</th><th>Verification</th></tr></thead>
      <tbody>{levyResult.data.map(r=><tr key={r.id}>
        <td>{r.levy_month}</td><td>{Number(r.amount_paid).toLocaleString('en-ZA',{minimumFractionDigits:2})}</td>
        <td>{r.payment_reference||'—'}</td><td>{r.verification_status}</td>
      </tr>)}</tbody>
    </table></div>}
 </section>;
}
