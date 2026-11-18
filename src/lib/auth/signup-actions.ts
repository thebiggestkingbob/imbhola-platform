'use server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
type Result={message:string;submitted:boolean};

/** Only activate after verified SMTP, bot protection and provider rate limits. */
export async function requestIdentityAccount(_prev:Result,formData:FormData):Promise<Result>{
 if(process.env.IMBHOLA_AUTH_SIGNUP_ENABLED!=='true'||process.env.IMBHOLA_AUTH_SIGNIN_ENABLED!=='true'){
  return {submitted:false,message:'Account registration is not open.'};
 }
 const email=formData.get('email'),password=formData.get('password');
 if(typeof email!=='string'||typeof password!=='string')
  return {submitted:false,message:'Please enter a valid email and password.'};
 const normalized=email.trim().toLowerCase();
 if(normalized.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)||password.length<12||password.length>128)
  return {submitted:false,message:'Enter a valid email and a password of at least 12 characters.'};
 const appUrl=process.env.NEXT_PUBLIC_APP_URL;
 if(!appUrl) return {submitted:false,message:'Registration service is not configured.'};
 let origin:string;
 try {const parsed=new URL(appUrl);if(parsed.protocol!=='https:' && parsed.hostname!=='localhost')throw Error('url');origin=parsed.origin;}
 catch {return {submitted:false,message:'Registration service is not configured.'};}
 const client=await createSupabaseServerClient();
 const {error}=await client.auth.signUp({email:normalized,password,options:{emailRedirectTo:origin+'/auth/callback'}});
 if(error)return {submitted:false,message:'We could not process the request right now.'};
 return {submitted:true,message:'If this address is eligible, check your inbox to verify it. Account creation never grants company access.'};
}
