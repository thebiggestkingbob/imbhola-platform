import {requireOrgWorkspace} from '@/lib/workspace/access';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function WorkforceSnapshots({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 if(!roles.some(r=>['company_admin','hr_admin','sdf','auditor'].includes(r)))return <p className="notice">Only authorised workforce reviewers can view snapshots.</p>;
 const {data,error}=await client.from('workforce_import_batches')
  .select('id,snapshot_date,row_count,source_filename,status,created_at,committed_at')
  .eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(50);
 return <section>
  <h2 className="workspace-section-title">Workforce snapshots</h2>
  <p className="workspace-caption">An auditable view of workforce snapshots linked to reporting years. Committed snapshots are immutable by design.</p>
  <p className="notice">New snapshots cannot yet be committed. This feature is awaiting data-processing approval and controlled import testing.</p>
  {error?<p className="notice" role="alert">Snapshot history could not be retrieved.</p>:
   !data?.length?<p className="workspace-caption">There are no committed or staged snapshots in this organisation.</p>:
   <div className="workspace-table-scroll">
    <table className="workspace-table">
    <thead><tr><th>Snapshot date</th><th>Records</th><th>Status</th><th>Source file</th><th>Created</th></tr></thead>
    <tbody>{data.map(batch=><tr key={batch.id}>
      <td>{batch.snapshot_date}</td>
      <td>{batch.row_count}</td>
      <td>{batch.status}</td>
      <td>{batch.source_filename}</td>
      <td>{batch.created_at.slice(0,10)}</td>
    </tr>)}</tbody>
    </table>
   </div>}
  <Link href={'/workspace/'+organizationId+'/workforce-import'} className="text-link">Review import requirements →</Link>
 </section>;
}
