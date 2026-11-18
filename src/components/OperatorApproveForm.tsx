'use client';
import {useActionState} from 'react';
import {approveEmployer} from '@/lib/ops/actions';
export default function OperatorApproveForm({applicationId}:{applicationId:string}){
 const [state,action,pending]=useActionState(approveEmployer,{saved:false,message:''});
 return <form action={action} className="workspace-entry-form">
  <input type="hidden" name="applicationId" value={applicationId}/>
  <label htmlFor={'verification-'+applicationId}>Verification evidence reference (required)</label>
  <input id={'verification-'+applicationId} name="verificationReference" required minLength={8} maxLength={600}/>
  <p className="workspace-caption">Only approve after independently verifying the employer and its authorised representative. Do not paste identity documents or credentials into this field.</p>
  <button type="submit" className="button" disabled={pending}>{pending?'Approving…':'Approve verified employer'}</button>
  {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
 </form>;
}
