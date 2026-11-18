'use server';
import {revalidatePath} from 'next/cache';
import {requirePlatformOperator} from './access';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
type State={saved:boolean;message:string};
export async function approveEmployer(_previous:State,data:FormData):Promise<State>{
 const applicationId=data.get('applicationId');
 const verificationReference=data.get('verificationReference');
 if(typeof applicationId!=='string'||typeof verificationReference!=='string'||
   !/^[0-9a-f-]{36}$/i.test(applicationId)||
   verificationReference.trim().length<8||verificationReference.length>600){
   return {saved:false,message:'An application and verification reference are required.'};
 }
 const {user}=await requirePlatformOperator();
 const admin=createSupabaseAdminClient();
 const {data:organizationId,error}=await admin.rpc('approve_organization_application',{
   p_application_id:applicationId,p_operator_id:user.id,
   p_verification_reference:verificationReference.trim(),
 });
 if(error||!organizationId)return {saved:false,message:'Approval could not be completed. Confirm the application is pending.'};
 revalidatePath('/ops/applications');
 return {saved:true,message:'Employer verified and the first company administrator approved.'};
}
