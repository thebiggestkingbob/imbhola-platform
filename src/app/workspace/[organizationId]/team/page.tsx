import {requireOrgWorkspace} from '@/lib/workspace/access';
import InviteMemberForm from '@/components/InviteMemberForm';
export const dynamic='force-dynamic';
export default async function Team({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 if(!roles.some(r=>['company_admin','hr_admin'].includes(r)))
  return <p className="notice">Team administration is restricted to company administrators and HR.</p>;
 const {data:members,error}=await client.from('organization_memberships')
  .select('id,user_id,role,status,created_at')
  .eq('organization_id',organizationId).order('created_at',{ascending:true}).limit(100);
 const canInvite=roles.includes('company_admin')&&process.env.IMBHOLA_INVITATIONS_ENABLED==='true';
 return <section>
  <h2 className="workspace-section-title">Company team</h2>
  <p className="workspace-caption">Only approved organisation memberships appear here. Roles are scoped per company.</p>
  {canInvite?<InviteMemberForm organizationId={organizationId}/>:<p className="notice">New invitations are not enabled in this environment.</p>}
  {error?<p className="notice">Unable to load members.</p>:
   !members?.length?<p className="notice">No approved memberships to display.</p>:
   <div className="workspace-table-scroll"><table className="workspace-table">
    <thead><tr><th>User reference</th><th>Organisation role</th><th>Status</th></tr></thead>
    <tbody>{members.map(m=><tr key={m.id}><td>{m.user_id.slice(0,8)}…</td>
     <td>{m.role.replaceAll('_',' ')}</td><td>{m.status}</td></tr>)}</tbody>
   </table></div>}
 </section>;
}
