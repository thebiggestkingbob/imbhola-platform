'use server';
import { revalidatePath } from 'next/cache';
import { requireOrgWorkspace } from './access';

type Result = {message:string;saved:boolean};
export async function submitTrainingRequest(_previous:Result, data:FormData):Promise<Result>{
  const organizationId = data.get('organizationId');
  const note = data.get('request_note');
  if(typeof organizationId!=='string'||typeof note!=='string'){
    return {message:'Invalid training request.',saved:false};
  }
  const message=note.trim();
  if(message.length<5||message.length>1000){
    return {message:'Please explain your training request in 5–1000 characters.',saved:false};
  }
  const {client,user}=await requireOrgWorkspace(organizationId);
  const {data:employee,error:lookupError}=await client.from('employee_profiles')
    .select('id').eq('organization_id',organizationId).eq('auth_user_id',user.id).maybeSingle();
  if(lookupError||!employee){
    return {message:'Your employee profile must be verified and linked before requesting training.',saved:false};
  }
  const {error}=await client.from('employee_training_requests').insert({
    organization_id:organizationId, employee_id:employee.id,
    request_note:message, status:'submitted',
  });
  if(error)return {message:'Request not saved. You may have reached the daily limit.',saved:false};
  revalidatePath('/workspace/'+organizationId+'/my-learning');
  return {message:'Your request has been submitted for review.',saved:true};
}
