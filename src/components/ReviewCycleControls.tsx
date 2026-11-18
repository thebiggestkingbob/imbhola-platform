'use client';
import {useActionState} from 'react';
import {submitReportingCycle,requestChanges} from '@/lib/workspace/review-actions';

export default function ReviewCycleControls({
 organizationId,cycleId,reportingYear,status,roles,
}:{organizationId:string;cycleId:string;reportingYear:number;status:string;roles:string[]}){
 const [state,action,pending]=useActionState(requestChanges,{saved:false,message:''});
 const canSubmit=status==='draft' && roles.some(r=>['company_admin','hr_admin','sdf'].includes(r));
 const canRequestChanges=status==='in_review' && roles.some(r=>['company_admin','committee_member','signatory'].includes(r));
 if(!canSubmit&&!canRequestChanges)return null;
 return <article className="workspace-review-card">
  <h3>Reporting year {reportingYear} · {status.replaceAll('_',' ')}</h3>
  {canSubmit&&<form action={submitReportingCycle.bind(null,organizationId,cycleId)}>
   <p className="workspace-caption">Submit this draft for internal review. This does not sign or submit a SETA return.</p>
   <button type="submit" className="workspace-mini-button">Send for internal review</button>
  </form>}
  {canRequestChanges&&<form action={action}>
   <input name="organizationId" value={organizationId} type="hidden"/>
   <input name="cycleId" value={cycleId} type="hidden"/>
   <label htmlFor={'review-'+cycleId}>What needs to be corrected?</label>
   <textarea id={'review-'+cycleId} required minLength={5} maxLength={2000} rows={3} name="comment"/>
   <button disabled={pending} type="submit" className="workspace-mini-button">{pending?'Saving…':'Request changes'}</button>
   {state.message&&<p className={state.saved?'workspace-success':'identity-error'} role="status">{state.message}</p>}
  </form>}
 </article>;
}
