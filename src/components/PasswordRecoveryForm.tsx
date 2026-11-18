'use client';
import {useActionState} from 'react';
import {requestPasswordReset} from '@/lib/auth/account-actions';
export default function PasswordRecoveryForm(){
 const [state,action,pending]=useActionState(requestPasswordReset,{message:'',submitted:false});
 return <form className="identity-form" action={action}>
  <label htmlFor="recovery-email">Email address</label>
  <input type="email" id="recovery-email" name="email" required maxLength={254} autoComplete="email"/>
  <button className="button" type="submit" disabled={pending}>{pending?'Sending…':'Request recovery email'}</button>
  {state.message&&<p role="status" className={state.submitted?'workspace-success':'identity-error'}>{state.message}</p>}
 </form>;
}
