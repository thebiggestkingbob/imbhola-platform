'use client';
import {useActionState} from 'react';
import {issueInvite} from '@/lib/onboarding/invite-actions';
const roles=[['employee','Employee'],['sdf','SDF'],['hr_admin','HR administrator'],
 ['training_admin','Training administrator'],['executive','Executive'],
 ['line_manager','Line manager'],['committee_member','Committee member'],
 ['auditor','Auditor']] as const;
export default function InviteMemberForm({organizationId}:{organizationId:string}){
 const [state,action,pending]=useActionState(issueInvite,{saved:false,message:''});
 return <form className="workspace-entry-form" action={action}>
  <h3>Invite an authorised member</h3>
  <input type="hidden" name="organizationId" value={organizationId}/>
  <label htmlFor="invite-email">Verified recipient email</label>
  <input id="invite-email" type="email" name="email" autoComplete="off" required maxLength={254}/>
  <label htmlFor="invite-role">Role in this organisation</label>
  <select id="invite-role" name="role" required>{roles.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select>
  <button className="button" type="submit" disabled={pending}>{pending?'Creating…':'Create one-time invitation code'}</button>
  {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
  {state.oneTimeCode&&<div className="notice"><strong>Share once, privately, with the invited person:</strong>
  <code className="workspace-secret">{state.oneTimeCode}</code>
  <p>The recipient should sign in and enter this code at /accept-invite. This code is displayed only in this response and is not emailed automatically.</p></div>}
 </form>;
}
