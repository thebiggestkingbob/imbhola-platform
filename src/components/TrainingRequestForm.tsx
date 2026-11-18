'use client';
import {useActionState} from 'react';
import {submitTrainingRequest} from '@/lib/workspace/employee-actions';
export default function TrainingRequestForm({organizationId}:{organizationId:string}){
 const [state,action,pending]=useActionState(submitTrainingRequest,{message:'',saved:false});
 return <form action={action} className="workspace-entry-form">
  <h3>Request training</h3>
  <input type="hidden" name="organizationId" value={organizationId}/>
  <label htmlFor="request_note">What skills or training would help you?</label>
  <textarea id="request_note" name="request_note" required minLength={5} maxLength={1000} rows={4} placeholder="Describe your development need without including private identity or medical information."/>
  <button type="submit" className="button" disabled={pending}>{pending?'Sending…':'Submit request'}</button>
  {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
  <p className="workspace-caption">Requests are visible to authorised HR/training staff. Do not include sensitive personal information.</p>
 </form>;
}
