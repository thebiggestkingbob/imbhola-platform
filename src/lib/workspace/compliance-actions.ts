'use server';
import {revalidatePath} from 'next/cache';
import {requireOrgWorkspace} from './access';
type State={saved:boolean;message:string};
function field(data:FormData,name:string){const raw=data.get(name);return typeof raw==='string'?raw.trim():''}
export async function saveComplianceProfile(_prev:State,data:FormData):Promise<State>{
  const organizationId=field(data,'organizationId');
  const {client,user,roles}=await requireOrgWorkspace(organizationId);
  if(!roles.some(r=>['company_admin','hr_admin'].includes(r)))return {saved:false,message:'This role cannot edit company compliance details.'};
  const registrationNumber=field(data,'registration_number');
  const sdlNumber=field(data,'sdl_number');
  const setaName=field(data,'seta_name');
  const industry=field(data,'industry');
  if([registrationNumber,sdlNumber,setaName,industry].some(s=>s.length>160)){
    return {saved:false,message:'One of the fields is too long.'};
  }
  const {error}=await client.from('organization_compliance_profiles').upsert({
    organization_id:organizationId,
    registration_number:registrationNumber||null,
    sdl_number:sdlNumber||null,
    seta_name:setaName||null,
    industry:industry||null,
    profile_status:'draft',
    updated_by:user.id,
    updated_at:new Date().toISOString(),
  },{onConflict:'organization_id'});
  if(error)return {saved:false,message:'Unable to save the company profile.'};
  revalidatePath('/workspace/'+organizationId+'/company');
  return {saved:true,message:'Draft profile saved. SETA and SDL details are unverified.'};
}
export async function addLevyRecord(_prev:State,data:FormData):Promise<State>{
  const organizationId=field(data,'organizationId');
  const {client,user,roles}=await requireOrgWorkspace(organizationId);
  if(!roles.some(r=>['company_admin','hr_admin'].includes(r)))return {saved:false,message:'Your role cannot add levy records.'};
  const cycleId=field(data,'cycle_id'),levyMonth=field(data,'levy_month');
  const paymentRef=field(data,'payment_reference'),amountStr=field(data,'amount_paid');
  const amount=Number(amountStr);
  if(!/^[0-9a-f-]{36}$/i.test(cycleId)||!/^[0-9]{4}-[0-9]{2}$/.test(levyMonth)||
    !/^\d+(\.\d{1,2})?$/.test(amountStr)||!Number.isFinite(amount)||amount<0||amount>1e12||paymentRef.length>160){
    return {saved:false,message:'Check the reporting year, levy month and payment information.'};
  }
  const {data:cycle}=await client.from('reporting_cycles').select('id').eq('organization_id',organizationId).eq('id',cycleId).maybeSingle();
  if(!cycle)return {saved:false,message:'Reporting year not found in this organisation.'};
  const {error}=await client.from('levy_payment_records').insert({
    organization_id:organizationId,cycle_id:cycleId,
    levy_month:levyMonth+'-01',amount_paid:amount,
    payment_reference:paymentRef||null,recorded_by:user.id,
    verification_status:'unverified',
  });
  if(error)return {saved:false,message:'The levy month may already exist, or the details could not be saved.'};
  revalidatePath('/workspace/'+organizationId+'/levies');
  return {saved:true,message:'Unverified levy record saved.'};
}
