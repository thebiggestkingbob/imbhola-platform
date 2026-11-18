'use client';
import {useActionState} from 'react';
import {acceptInvite} from '@/lib/onboarding/invite-actions';
export default function AcceptInviteForm(){
 const [state,action,pending]=useActionState(acceptInvite,{saved:false,message:''});
 return <form className="workspace-entry-form" action={action}>
  <h3>Accept your organisation invitation</h3>
  <label htmlFor="invite-token">One-time invitation code</label>
  <input id="invite-token" name="token" autoComplete="off" minLength={64} maxLength={64} required/>
  <p className="workspace-caption">The invitation works only for the exact verified email it was issued to. Codes expire and cannot be reused.</p>
  <button className="button" type="submit" disabled={pending}>{pending?'Verifying…':'Accept invitation'}</button>
  {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
 </form>;
}
