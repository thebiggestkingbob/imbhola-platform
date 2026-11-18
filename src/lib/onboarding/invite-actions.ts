'use server';
import {randomBytes,createHash} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {requireOrgWorkspace} from '@/lib/workspace/access';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
type IssueState={saved:boolean;message:string;oneTimeCode?:string};
type AcceptState={saved:boolean;message:string};
const allowedRoles=['executive','hr_admin','training_admin','sdf','line_manager','committee_member','employee','auditor'];
export async function issueInvite(_prev:IssueState,data:FormData):Promise<IssueState>{
 if(!isIdentitySignInEnabled()||process.env.IMBHOLA_INVITATIONS_ENABLED!=='true')
  return {saved:false,message:'Invitations are not enabled.'};
 const org=data.get('organizationId'),email=data.get('email'),role=data.get('role');
 if(typeof org!=='string'||typeof email!=='string'||typeof role!=='string')
  return {saved:false,message:'Invalid invitation details.'};
 const cleanEmail=email.trim().toLowerCase();
 if(cleanEmail.length>254||!/^\S+@\S+\.\S+$/.test(cleanEmail)||!allowedRoles.includes(role))
  return {saved:false,message:'Check the email address and role.'};
 const {client,roles}=await requireOrgWorkspace(org);
 if(!roles.includes('company_admin'))return {saved:false,message:'Only a verified company administrator can invite members.'};
 const token=randomBytes(32).toString('hex');
 const tokenHash=createHash('sha256').update(token,'utf8').digest('hex');
 const expiration=new Date(Date.now()+48*3600*1000).toISOString();
 const {error}=await client.rpc('issue_organization_invite',{
  p_org:org,p_email:cleanEmail,p_role:role,p_token_hash:tokenHash,p_expires_at:expiration,
 });
 if(error)return {saved:false,message:'Could not create invitation. Please check limits and organisation approval.'};
 revalidatePath('/workspace/'+org+'/team');
 return {saved:true,message:'One-time code created. Share it privately with the intended recipient; it expires in 48 hours.',oneTimeCode:token};
}
export async function acceptInvite(_prev:AcceptState,data:FormData):Promise<AcceptState>{
 if(!isIdentitySignInEnabled()||process.env.IMBHOLA_INVITATIONS_ENABLED!=='true')
  return {saved:false,message:'Invitation acceptance is not active.'};
 const token=data.get('token');
 if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token.trim()))
  return {saved:false,message:'Invalid or expired invitation code.'};
 const client=await createSupabaseServerClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.email_confirmed_at)return {saved:false,message:'Sign in with your verified invited email before accepting.'};
 const tokenHash=createHash('sha256').update(token.trim(),'utf8').digest('hex');
 const {data:org,error}=await client.rpc('accept_organization_invite',{p_token_hash:tokenHash});
 if(error||!org)return {saved:false,message:'Invitation not available for this verified email or it has expired.'};
 revalidatePath('/dashboard');
 return {saved:true,message:'Invitation accepted. Your organisation is now available in your dashboard.'};
}
