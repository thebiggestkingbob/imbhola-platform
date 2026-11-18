'use server';
import {revalidatePath} from 'next/cache';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
type State={saved:boolean;message:string};
export async function applyForEmployerAccount(_prev:State,data:FormData):Promise<State>{
 if(!isIdentitySignInEnabled()||process.env.IMBHOLA_COMPANY_APPLICATIONS_ENABLED!=='true'){
  return {saved:false,message:'Company applications are not yet open.'};
 }
 const name=data.get('legal_name'),registration=data.get('registration_number');
 if(typeof name!=='string'||typeof registration!=='string'||name.trim().length<2||name.trim().length>250||registration.length>160)
  return {saved:false,message:'Check the company name and registration reference.'};
 const client=await createSupabaseServerClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.email_confirmed_at||!user.email){
  return {saved:false,message:'A verified account is required before applying.'};
 }
 const {error}=await client.from('organization_applications').insert({
  requester_id:user.id,legal_name:name.trim(),registration_number:registration.trim()||null,
  contact_email:user.email.trim().toLowerCase(),status:'pending',
 });
 if(error)return {saved:false,message:'Application not saved. You may have reached the submission limit.'};
 revalidatePath('/apply');
 return {saved:true,message:'Application received for independent verification. No company access has been granted.'};
}
