import {requireOrgWorkspace} from '@/lib/workspace/access';
import {rankOfoCandidates} from '@/lib/workforce/ofo';
export const dynamic='force-dynamic';
const rolesAllowed=['company_admin','hr_admin','training_admin','sdf','auditor'];
export default async function OfoMapping({params,searchParams}:{
 params:Promise<{organizationId:string}>,
 searchParams:Promise<{q?:string}>
}){
 const {organizationId}=await params;
 const {client,roles}=await requireOrgWorkspace(organizationId);
 if(!roles.some(r=>rolesAllowed.includes(r)))return <p className="notice">Occupation references are restricted to authorised staff.</p>;
 const {q=''}=await searchParams;
 const term=q.slice(0,160).trim();
 const {data:versions,error:vError}=await client.from('ofo_reference_versions')
  .select('id,version_name,verified_at').not('verified_at','is',null).limit(10);
 const versionIds=(versions??[]).map(v=>v.id);
 let references:{code:string;title:string;version:string}[]=[];
 if(versionIds.length){
  const {data:occupations,error:oError}=await client.from('ofo_occupations')
   .select('code,title,version_id').in('version_id',versionIds).limit(1000);
  if(!oError){
   const map=new Map((versions??[]).map(v=>[v.id,v.version_name]));
   references=(occupations??[]).map(o=>({code:o.code,title:o.title,version:map.get(o.version_id)??''}));
  }
 }
 const suggestions=term?rankOfoCandidates(term,references,3):[];
 return <section>
  <h2 className="workspace-section-title">OFO occupation mapping</h2>
  <p className="workspace-caption">Search against reviewed, versioned occupational reference data. Suggested matches need human review, and no official OFO codes are invented.</p>
  <form method="get" className="workspace-entry-form">
   <h3>Look up job title</h3>
   <label htmlFor="ofo-job">Job title</label>
   <input id="ofo-job" name="q" type="search" maxLength={160} defaultValue={term} placeholder="Enter the title to compare"/>
   <button type="submit" className="button">Find candidate codes</button>
  </form>
  {vError?<p className="notice" role="alert">Reference catalogue is temporarily unavailable.</p>:
   !versionIds.length?<p className="notice">No officially sourced, reviewed OFO catalogue has been approved for this system yet. Matching is disabled until that reference data is loaded and verified.</p>:
   term && !suggestions.length?<p className="notice">No candidate matches were found within the first 1,000 reference entries. This is not a complete occupation lookup.</p>:
   suggestions.length>0?<div className="grid">
    {suggestions.map(s=><article className="card" key={s.version+s.code}>
      <span className="card-number">ADVISORY MATCH · {s.score}% textual similarity</span>
      <h3>{s.title}</h3><p>Code: {s.code} · Reference version: {s.version}</p>
      <p>Shared title terms: {s.matchedTerms.join(', ')}</p>
    </article>)}
   </div>:null}
  <p className="notice">No employee OFO assignments or overrides are saved here. A verified master catalogue and approved reviewer workflow are required before mappings become reportable.</p>
 </section>;
}
