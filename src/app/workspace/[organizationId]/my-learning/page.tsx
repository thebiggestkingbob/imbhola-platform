import Link from 'next/link';
import { requireOrgWorkspace } from '@/lib/workspace/access';
import TrainingRequestForm from '@/components/TrainingRequestForm';

export const dynamic = 'force-dynamic';

export default async function MyLearning({params}:{
  params:Promise<{organizationId:string}>
}){
 const {organizationId}=await params;
 const {client,user}=await requireOrgWorkspace(organizationId);
 const {data:employee,error}=await client.from('employee_profiles')
  .select('id,given_name,family_name,job_title')
  .eq('organization_id',organizationId).eq('auth_user_id',user.id).maybeSingle();
 if(error||!employee)return <section>
  <h2 className="workspace-section-title">My learning</h2>
  <p className="notice">Your account has not been linked to a verified employee record. Contact your authorised company administrator to complete verification.</p>
  <Link href="/dashboard" className="text-link">Back to your organisations →</Link>
 </section>;
 const [attendance, requests]=await Promise.all([
  client.from('training_participations').select('id,event_id,status,created_at')
   .eq('organization_id',organizationId).eq('employee_id',employee.id).limit(50),
  client.from('employee_training_requests').select('id,request_note,status,created_at')
   .eq('organization_id',organizationId).eq('employee_id',employee.id)
   .order('created_at',{ascending:false}).limit(25),
 ]);
 return <section>
  <h2 className="workspace-section-title">My learning</h2>
  <p className="workspace-caption">Your own authorised learning record: {employee.given_name} {employee.family_name}{employee.job_title?' · '+employee.job_title:''}</p>
  <h3>Training participation</h3>
  {attendance.error?<p className="notice">Training history is temporarily unavailable.</p>:
   !attendance.data?.length?<p className="notice">No training participation has been assigned to your record yet.</p>:
   <div className="workspace-table-scroll"><table className="workspace-table">
   <thead><tr><th>Status</th><th>Recorded</th><th>Event reference</th></tr></thead>
   <tbody>{attendance.data.map(a=><tr key={a.id}><td>{a.status.replaceAll('_',' ')}</td><td>{a.created_at.slice(0,10)}</td><td>{a.event_id.slice(0,8)}</td></tr>)}</tbody>
   </table></div>}
  <h3>My training requests</h3>
  {requests.error?<p className="notice">Requests could not be loaded.</p>:
   !requests.data?.length?<p className="workspace-caption">No previous requests.</p>:
   <div className="workspace-table-scroll"><table className="workspace-table">
    <thead><tr><th>Requested training</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>{requests.data.map(r=><tr key={r.id}><td>{r.request_note}</td><td>{r.status.replaceAll('_',' ')}</td><td>{r.created_at.slice(0,10)}</td></tr>)}</tbody>
   </table></div>}
  <TrainingRequestForm organizationId={organizationId}/>
 </section>;
}
