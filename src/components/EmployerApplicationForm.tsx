'use client';
import {useActionState} from 'react';
import {applyForEmployerAccount} from '@/lib/onboarding/actions';
export default function EmployerApplicationForm(){
 const [state,action,pending]=useActionState(applyForEmployerAccount,{saved:false,message:''});
 return <form action={action} className="workspace-entry-form">
  <h3>Request employer verification</h3>
  <label htmlFor="legal_name">Registered legal company name</label>
  <input id="legal_name" name="legal_name" minLength={2} maxLength={250} required/>
  <label htmlFor="registration_number">Registration reference (optional)</label>
  <input id="registration_number" name="registration_number" maxLength={160}/>
  <p className="workspace-caption">Your verified account email will be used for this application. Registration requests do not automatically give access to any company.</p>
  <button type="submit" className="button" disabled={pending}>{pending?'Submitting…':'Submit for verification'}</button>
  {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
 </form>;
}
