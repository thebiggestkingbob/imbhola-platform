'use client';
import {useActionState} from 'react';
import {requestIdentityAccount} from '@/lib/auth/signup-actions';
export default function IdentitySignupForm(){
 const [state,action,pending]=useActionState(requestIdentityAccount,{submitted:false,message:''});
 return <form className="identity-form" action={action}>
  <label htmlFor="signup-email">Work email</label>
  <input id="signup-email" type="email" name="email" autoComplete="email" maxLength={254} required/>
  <label htmlFor="signup-password">Password (at least 12 characters)</label>
  <input id="signup-password" type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required/>
  <button disabled={pending} className="button" type="submit">{pending?'Processing…':'Request account'}</button>
  {state.message&&<p role="status" className={state.submitted?'workspace-success':'identity-error'}>{state.message}</p>}
  <p className="identity-note">Verifying your email does not grant access to an employer. An approved company invitation is also required.</p>
 </form>;
}
