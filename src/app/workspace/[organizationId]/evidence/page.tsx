import {requireOrgWorkspace} from '@/lib/workspace/access';
import {EVIDENCE_CATEGORIES,evidenceIsReportReady} from '@/lib/evidence/requirements';
export const dynamic='force-dynamic';
const allowed=['company_admin','hr_admin','training_admin','sdf','auditor','signatory'];
export default async function EvidenceVault({params}:{
  params:Promise<{organizationId:string}>
}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 if(!roles.some(r=>allowed.includes(r)))return <section>
   <h2 className="workspace-section-title">Evidence Vault</h2>
   <p className="notice">Evidence documents are restricted to authorised organisation roles.</p>
 </section>;
 const {data,error}=await client.from('evidence_metadata')
  .select('id,original_filename,evidence_category,review_status,scan_status,related_record_type,created_at,retention_until')
  .eq('organization_id',organizationId)
  .order('created_at',{ascending:false})
  .limit(100);
 const today=new Date().toISOString().slice(0,10);
 const visible=data??[];
 const ready=visible.filter(d=>evidenceIsReportReady(d.scan_status,d.review_status,d.retention_until,today));
 return <section>
  <div className="eyebrow">SECURE RECORDS</div>
  <h2 className="workspace-section-title">Evidence Vault</h2>
  <p className="workspace-caption">Organise the documents that support training activity, ATR evidence and approvals. Records in this view must pass malware scanning and human review before becoming visible.</p>
  <div className="workspace-metrics">
    <div className="workspace-metric"><span>Visible accepted records</span><strong>{error?'—':visible.length}</strong><small>Up to 100 shown</small></div>
    <div className="workspace-metric"><span>Ready within retention</span><strong>{error?'—':ready.length}</strong><small>Metadata checks only</small></div>
  </div>
  <p className="notice">Document upload, malware screening, downloads, and review actions are not yet active. No evidence is marked legally compliant by this view. Documents awaiting review are deliberately hidden from ordinary read access.</p>
  <h3 className="workspace-list-title">Evidence categories</h3>
  <div className="workspace-check-grid">{EVIDENCE_CATEGORIES.map(category=>
   <article className="workspace-check" key={category.code}>
    <strong>{category.label}</strong><p>{category.description}</p>
   </article>)}</div>
  <h3 className="workspace-list-title">Accepted records</h3>
  {error?<p className="notice" role="alert">Accepted evidence could not be loaded.</p>:
   !visible.length?<p className="workspace-caption">No accepted, scanned evidence records are available.</p>:
   <div className="workspace-table-scroll"><table className="workspace-table">
    <thead><tr><th>File</th><th>Category</th><th>Record</th><th>Review</th><th>Retention</th></tr></thead>
    <tbody>{visible.map(d=><tr key={d.id}>
      <td>{d.original_filename}</td><td>{d.evidence_category.replaceAll('_',' ')}</td>
      <td>{d.related_record_type.replaceAll('_',' ')}</td>
      <td>{evidenceIsReportReady(d.scan_status,d.review_status,d.retention_until,today)?'Accepted':'Review expiry'}</td>
      <td>{d.retention_until??'Policy pending'}</td>
    </tr>)}</tbody></table></div>}
 </section>;
}
