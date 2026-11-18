'use client';
import {useActionState} from 'react';
import {saveComplianceProfile} from '@/lib/workspace/compliance-actions';
type Profile={registration_number:string|null;sdl_number:string|null;seta_name:string|null;industry:string|null};
export default function ComplianceProfileForm({organizationId,profile}:{organizationId:string;profile:Profile|null}){
 const [state,action,pending]=useActionState(saveComplianceProfile,{saved:false,message:''});
 return <form action={action} className="workspace-entry-form">
  <h3>Company compliance details</h3>
  <input type="hidden" name="organizationId" value={organizationId}/>
  <label htmlFor="registration_number">Company registration number</label>
  <input id="registration_number" name="registration_number" maxLength={160} defaultValue={profile?.registration_number??''}/>
  <label htmlFor="sdl_number">SDL registration reference</label>
  <input id="sdl_number" name="sdl_number" maxLength={160} defaultValue={profile?.sdl_number??''}/>
  <label htmlFor="seta_name">SETA (unverified)</label>
  <input id="seta_name" name="seta_name" maxLength={160} defaultValue={profile?.seta_name??''}/>
  <label htmlFor="industry">Industry</label>
  <input id="industry" name="industry" maxLength={160} defaultValue={profile?.industry??''}/>
  <p className="workspace-caption">These are manually supplied draft details. They do not verify SETA registration or SDL status.</p>
  <button type="submit" className="button" disabled={pending}>{pending?'Saving…':'Save draft company profile'}</button>
  {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
 </form>;
}
