'use client';
import {useState} from 'react';
import {createSupabaseBrowserClient} from '@/lib/supabase/browser';

export default function MfaSetup(){
 const [secret,setSecret]=useState('');
 const [factorId,setFactorId]=useState('');
 const [code,setCode]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 async function enroll(){
  setBusy(true);setMessage('');
  try{
   const client=createSupabaseBrowserClient();
   const {data:existing,error:existingError}=await client.auth.mfa.listFactors();
   if(existingError)throw Error('Unable to check authenticator factors.');
   const current=existing.totp.find(f=>f.status==='verified');
   if(current){setFactorId(current.id);setSecret('');setMessage('Your authenticator is registered. Enter a current code to verify this session.');return;}
   const {data,error}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Imbhola authenticator'});
   if(error||!data||data.type!=='totp')throw Error('Could not enroll an authenticator.');
   setFactorId(data.id);setSecret(data.totp.secret);setMessage('Add the secret to your authenticator app and enter its six-digit code.');
  }catch{setMessage('Authenticator setup could not be started. Try again later.');}
  finally{setBusy(false);}
 }
 async function verify(){
  if(!factorId||!/^[0-9]{6}$/.test(code))return;
  setBusy(true);setMessage('');
  try{
   const client=createSupabaseBrowserClient();
   const {data:challenge,error:challengeError}=await client.auth.mfa.challenge({factorId});
   if(challengeError||!challenge)throw Error('challenge');
   const {error}=await client.auth.mfa.verify({factorId,challengeId:challenge.id,code});
   if(error)throw Error('verify');
   setSecret('');setCode('');setMessage('Your authenticator was verified. You can now return to the workspace.');
  }catch{setMessage('Verification failed. Check your authenticator code and try again.');}
  finally{setBusy(false);}
 }
 return <section className="identity-form">
  <h2 className="workspace-section-title">Authenticator verification</h2>
  <p className="identity-note">Imbhola uses time-based one-time codes for privileged access. Keep your authenticator secret private.</p>
  <button className="button" type="button" onClick={enroll} disabled={busy}>Set up or verify authenticator</button>
  {secret&&<div><p>Add this secret to your authenticator app:</p><code className="mfa-secret">{secret}</code></div>}
  {factorId&&<><label htmlFor="totp-code">Six-digit authenticator code</label>
   <input id="totp-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/>
   <button className="button" type="button" onClick={verify} disabled={busy||!/^[0-9]{6}$/.test(code)}>Verify code</button></>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
