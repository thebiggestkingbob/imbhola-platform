'use server';
import { revalidatePath } from 'next/cache';
import { requireOrgWorkspace } from './access';
import { isWorkspaceSection } from './sections';

type Result = {message:string;saved:boolean};
const EDITORS = ['company_admin','hr_admin','training_admin','sdf'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const read = (d:FormData,k:string) => typeof d.get(k)==='string'?String(d.get(k)).trim():'';
const nonnegative = (s:string,whole:boolean) => {
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n=Number(s);
  return n>=0&&Number.isFinite(n)&&n<1000000000000&&(!whole||Number.isInteger(n))?n:null;
};
const validDate=(d:string)=> /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

export async function createDraftRecord(_previous:Result,data:FormData):Promise<Result>{
  const organizationId=read(data,'organizationId');
  const section=read(data,'section');
  if(!isWorkspaceSection(section)||!['reporting','training-events','wsp','atr','tasks'].includes(section)){
    return {saved:false,message:'Unsupported draft type.'};
  }
  const {client,user,roles}=await requireOrgWorkspace(organizationId);
  if(!roles.some(r=>EDITORS.includes(r))) return {saved:false,message:'Your role cannot create this record.'};
  const fail=(message:string):Result=>({saved:false,message});
  let table:'reporting_cycles'|'training_events'|'wsp_plan_items'|'atr_records'|'workflow_tasks';
  let record:Record<string,string|number|null>={organization_id:organizationId};
  if(section==='reporting'){
    if(!roles.some(r=>['company_admin','hr_admin','sdf'].includes(r)))return fail('Your role cannot create reporting years.');
    const year=Number(read(data,'reporting_year'));
    if(!Number.isInteger(year)||year<2020||year>2100)return fail('Enter a valid reporting year.');
    table='reporting_cycles';
    record={...record,reporting_year:year,status:'draft'};
  } else if(section==='training-events'){
    const programId=read(data,'program_id'),date=read(data,'event_date');
    const participants=nonnegative(read(data,'participants_count'),true);
    const cost=nonnegative(read(data,'actual_cost'),false);
    if(!UUID.test(programId)||!validDate(date)||participants===null||cost===null)return fail('Check training event details.');
    table='training_events';
    record={...record,program_id:programId,event_date:date,participants_count:participants,actual_cost:cost,status:'draft',recorded_by:user.id};
  } else if(section==='wsp'){
    const cycleId=read(data,'cycle_id'),programId=read(data,'program_id');
    const learners=nonnegative(read(data,'planned_learners'),true);
    const cost=nonnegative(read(data,'planned_cost'),false);
    const quarter=read(data,'quarter');
    if(!UUID.test(cycleId)||!UUID.test(programId)||learners===null||cost===null||!['Q1','Q2','Q3','Q4'].includes(quarter))return fail('Check planned training details.');
    const {data:cycle}=await client.from('reporting_cycles').select('status').eq('id',cycleId).eq('organization_id',organizationId).maybeSingle();
    if(cycle?.status!=='draft')return fail('WSP entries can only be added to draft reporting years.');
    table='wsp_plan_items';
    record={...record,cycle_id:cycleId,program_id:programId,planned_learners:learners,planned_cost:cost,quarter,status:'draft'};
  } else if(section==='atr'){
    const cycleId=read(data,'cycle_id'),eventId=read(data,'event_id');
    if(!UUID.test(cycleId)||!UUID.test(eventId))return fail('Select a reporting year and training event.');
    const [cycle,event]=await Promise.all([
      client.from('reporting_cycles').select('status').eq('id',cycleId).eq('organization_id',organizationId).maybeSingle(),
      client.from('training_events').select('status').eq('id',eventId).eq('organization_id',organizationId).maybeSingle(),
    ]);
    if(cycle.data?.status!=='draft'||event.data?.status!=='completed')return fail('ATR records require a draft year and a completed training event.');
    table='atr_records';
    record={...record,cycle_id:cycleId,event_id:eventId,evidence_state:'missing',status:'draft'};
  } else {
    const title=read(data,'title'),dueOn=read(data,'due_on');
    if(title.length<3||title.length>200||(dueOn&&!validDate(dueOn)))return fail('Check task title and date.');
    table='workflow_tasks';
    record={...record,title,due_on:dueOn||null,status:'open',assigned_user_id:user.id};
  }
  // User cookie identity + RLS policies are checked again by Postgres for every write.
  const {error}=await client.from(table).insert(record);
  if(error)return fail('Unable to save this draft. Check for duplicates and valid organisation records.');
  revalidatePath('/workspace/'+organizationId+'/'+section);
  revalidatePath('/workspace/'+organizationId);
  return {saved:true,message:'Draft record saved to your organisation.'};
}

/** Explicit completion transition; Postgres rejects changes to other training event fields. */
export async function completeTrainingEvent(organizationId:string,eventId:string):Promise<void>{
  if(!UUID.test(eventId)) return;
  const {client,roles}=await requireOrgWorkspace(organizationId);
  if(!roles.some(r=>EDITORS.includes(r)))return;
  const {error}=await client.from('training_events').update({status:'completed'})
    .eq('id',eventId).eq('organization_id',organizationId).eq('status','draft');
  if(!error){
    revalidatePath('/workspace/'+organizationId+'/training-events');
    revalidatePath('/workspace/'+organizationId+'/atr');
  }
}
