'use server';
import { revalidatePath } from 'next/cache';
import { requireOrgWorkspace } from './access';

type ReviewState={saved:boolean;message:string};

export async function submitReportingCycle(organizationId:string,cycleId:string):Promise<void>{
  const {client,roles}=await requireOrgWorkspace(organizationId);
  if(!roles.some(r=>['company_admin','hr_admin','sdf'].includes(r)))return;
  const {data,error}=await client.rpc('submit_reporting_cycle_for_review',{p_org:organizationId,p_cycle:cycleId});
  if(!error && data){
    revalidatePath('/workspace/'+organizationId+'/reporting');
    revalidatePath('/workspace/'+organizationId);
  }
}

export async function requestChanges(_previous:ReviewState,formData:FormData):Promise<ReviewState>{
  const organizationId=formData.get('organizationId');
  const cycleId=formData.get('cycleId');
  const comment=formData.get('comment');
  if(typeof organizationId!=='string'||typeof cycleId!=='string'||typeof comment!=='string'){
    return {saved:false,message:'Invalid review request.'};
  }
  const note=comment.trim();
  if(note.length<5||note.length>2000)return {saved:false,message:'Provide a review note of 5–2000 characters.'};
  const {client,roles}=await requireOrgWorkspace(organizationId);
  if(!roles.some(r=>['company_admin','committee_member','signatory'].includes(r)))return {saved:false,message:'Your role cannot request changes.'};
  const {data,error}=await client.rpc('request_reporting_cycle_changes',{
    p_org:organizationId,p_cycle:cycleId,p_comment:note,
  });
  if(error||!data)return {saved:false,message:'Unable to record changes. The cycle may no longer be in review.'};
  revalidatePath('/workspace/'+organizationId+'/reporting');
  revalidatePath('/workspace/'+organizationId+'/approvals');
  return {saved:true,message:'Changes requested. The reporting cycle is back in draft.'};
}
