'use server';
import {requireOrgWorkspace} from '@/lib/workspace/access';
import {previewWorkforceCsv} from './csv';
type State = {message:string;rowCount:number;issueCount:number;duplicates:number;issues:string[];ready:boolean};
export async function previewWorkforceUpload(_prev:State,form:FormData):Promise<State>{
  const blocked:State={message:'Workforce uploads are disabled pending privacy and security approval.',rowCount:0,issueCount:0,duplicates:0,issues:[],ready:false};
  if(process.env.IMBHOLA_WORKFORCE_PREVIEW_ENABLED!=='true')return blocked;
  const org=form.get('organizationId'),file=form.get('file');
  if(typeof org!=='string'||!(file instanceof File)||file.size>2_000_000||file.size===0||
    !file.name.toLowerCase().endsWith('.csv'))return {...blocked,message:'Select a CSV file up to 2 MB.'};
  const {roles}=await requireOrgWorkspace(org);
  if(!roles.some(r=>['company_admin','hr_admin','sdf'].includes(r)))return {...blocked,message:'You are not authorised to preview workforce imports.'};
  try{
    const source=await file.text();
    const result=previewWorkforceCsv(source);
    const errors=result.issues;
    return {
      message:errors.length?'Review the validation errors before continuing. No records were saved.':
       'All rows passed the preliminary CSV checks. No records were saved.',
      rowCount:result.rows.length,duplicates:result.duplicates,issueCount:errors.length,
      issues:errors.slice(0,20).map(e=>'Row '+e.row+' · '+e.field+': '+e.message),
      ready:errors.length===0,
    };
  }catch(error){
    return {...blocked,message:error instanceof Error?error.message:'Could not parse CSV'};
  }
}
