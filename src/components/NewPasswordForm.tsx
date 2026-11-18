'use client';
import {useActionState} from 'react';
import {changePassword} from '@/lib/auth/account-actions';
export default function NewPasswordForm(){
 const [state,action,pending]=useActionState(changePassword,{message:'',submitted:false});
 return <form className="identity-form" action={action}>
  <label htmlFor="new-password">New password</label>
  <input id="new-password" name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required/>
  <label htmlFor="confirm-password">Confirm new password</label>
  <input id="confirm-password" name="confirm" type="password" minLength={12} maxLength={128} autoComplete="new-password" required/>
  <button className="button" disabled={pending} type="submit">{pending?'Updating…':'Update password'}</button>
  {state.message&&<p role="alert" className="identity-error">{state.message}</p>}
 </form>;
}
