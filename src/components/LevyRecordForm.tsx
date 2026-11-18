'use client';
import {useActionState} from 'react';
import {addLevyRecord} from '@/lib/workspace/compliance-actions';
export default function LevyRecordForm({organizationId,cycles}:{organizationId:string;cycles:{id:string;year:number}[]}){
 const [state,action,pending]=useActionState(addLevyRecord,{saved:false,message:''});
 if(!cycles.length)return <p className="notice">Create a reporting year before capturing monthly levy records.</p>;
 return <form className="workspace-entry-form" action={action}>
  <h3>Record an SDL payment (unverified)</h3>
  <input type="hidden" name="organizationId" value={organizationId}/>
  <label htmlFor="cycle_id">Reporting year</label>
  <select id="cycle_id" name="cycle_id" required>{cycles.map(c=><option key={c.id} value={c.id}>{c.year}</option>)}</select>
  <label htmlFor="levy_month">Payment month</label>
  <input id="levy_month" type="month" name="levy_month" required/>
  <label htmlFor="amount_paid">Amount paid (ZAR)</label>
  <input id="amount_paid" type="number" name="amount_paid" min="0" step="0.01" required/>
  <label htmlFor="payment_reference">Payment reference (optional)</label>
  <input id="payment_reference" name="payment_reference" maxLength={160}/>
  <button type="submit" className="button" disabled={pending}>{pending?'Saving…':'Save unverified levy payment'}</button>
  {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
 </form>;
}
