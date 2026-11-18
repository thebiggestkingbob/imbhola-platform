'use server';
import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isIdentitySignInEnabled} from './flags';
type Result={message:string;submitted:boolean};
const enabled=()=>isIdentitySignInEnabled()&&process.env.IMBHOLA_AUTH_SIGNUP_ENABLED==='true';
function validEmail(email:string){return email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}
function baseUrl(){
 const raw=process.env.NEXT_PUBLIC_APP_URL;
 if(!raw)throw new Error('Application URL not configured');
 const url=new URL(raw);
 if(url.protocol!=='https:' && !(url.protocol==='http:'&&url.hostname==='localhost'))throw new Error('Invalid app URL');
 return url.origin;
}
export async function createAccount(_prev:Result,data:FormData):Promise<Result>{
 if(!enabled())return {message:'Account creation is not open.',submitted:false};
 const email=data.get('email'),password=data.get('password'),confirm=data.get('confirm');
 if(typeof email!=='string'||typeof password!=='string'||typeof confirm!=='string')return {message:'Complete all required fields.',submitted:false};
 const e=email.trim().toLowerCase();
 if(!validEmail(e)||password.length<12||password.length>128||password!==confirm){
  return {message:'Enter a valid email and matching password of at least 12 characters.',submitted:false};
 }
 const client=await createSupabaseServerClient();
 try {
  const {data:result,error}=await client.auth.signUp({
   email:e,password,
   options:{emailRedirectTo:baseUrl()+'/auth/callback'},
  });
  if(result.session)await client.auth.signOut();
  if(error)return {message:'If this email can register, instructions will be sent. Please try again later if nothing arrives.',submitted:true};
 }catch{
  return {message:'Account service unavailable. Please try later.',submitted:false};
 }
 return {message:'If registration is available, an email verification link will arrive shortly. Verify your address before continuing.',submitted:true};
}
export async function requestPasswordReset(_prev:Result,data:FormData):Promise<Result>{
 if(!isIdentitySignInEnabled())return {message:'Account recovery is unavailable.',submitted:false};
 const email=data.get('email');
 if(typeof email!=='string'||!validEmail(email.trim().toLowerCase()))return {message:'Enter a valid email.',submitted:false};
 try{
  const client=await createSupabaseServerClient();
  await client.auth.resetPasswordForEmail(email.trim().toLowerCase(),{
   redirectTo:baseUrl()+'/auth/callback?flow=recovery',
  });
 }catch{return {message:'Account recovery could not be started.',submitted:false};}
 return {message:'If an account exists, password recovery instructions will be emailed.',submitted:true};
}
export async function changePassword(_prev:Result,data:FormData):Promise<Result>{
 if(!isIdentitySignInEnabled())return {message:'Password changes are unavailable.',submitted:false};
 const password=data.get('password'),confirm=data.get('confirm');
 if(typeof password!=='string'||typeof confirm!=='string'||password.length<12||password.length>128||password!==confirm){
  return {message:'Use a matching password of 12–128 characters.',submitted:false};
 }
 const client=await createSupabaseServerClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user)return {message:'Recovery session expired. Request a new email link.',submitted:false};
 const {error}=await client.auth.updateUser({password});
 if(error)return {message:'Could not update your password. Try a new recovery link.',submitted:false};
 await client.auth.signOut();
 redirect('/login?password=updated');
}
