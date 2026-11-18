'use client';
import {useActionState} from 'react';
import {createAccount} from '@/lib/auth/account-actions';
export default function AccountRegistrationForm(){
 const [state,action,pending]=useActionState(createAccount,{message:'',submitted:false});
 return <form className="identity-form" action={action}>
  <label htmlFor="registration-email">Email</label>
  <input id="registration-email" type="email" name="email" autoComplete="email" required maxLength={254}/>
  <label htmlFor="registration-password">Password (at least 12 characters)</label>
  <input id="registration-password" type="password" name="password" autoComplete="new-password" required minLength={12} maxLength={128}/>
  <label htmlFor="registration-confirm">Confirm password</label>
  <input id="registration-confirm" type="password" name="confirm" autoComplete="new-password" required minLength={12} maxLength={128}/>
  <p className="identity-note">An account does not automatically give access to an employer. Organisations require independent verification and explicit invitations.</p>
  <button className="button" type="submit" disabled={pending}>{pending?'Submitting…':'Create account'}</button>
  {state.message&&<p role="status" className={state.submitted?'workspace-success':'identity-error'}>{state.message}</p>}
 </form>;
}
