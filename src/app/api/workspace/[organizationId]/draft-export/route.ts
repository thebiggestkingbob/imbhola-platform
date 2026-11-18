import { NextRequest, NextResponse } from 'next/server';
import { requireOrgWorkspace } from '@/lib/workspace/access';

/**
 * Internal CSV previews only. This route CANNOT produce SETA official templates.
 * It is designed to fail closed if the user or organisation is not authorised.
 */
export const dynamic = 'force-dynamic';

function safeCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[\s]*[=+@\-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"','""') + '"';
}

export async function GET(request: NextRequest,{params}:{
  params:Promise<{organizationId:string}>
}) {
  const {organizationId}=await params;
  const type=request.nextUrl.searchParams.get('type');
  if(type!=='wsp' && type!=='atr'){
    return NextResponse.json({error:'Invalid internal export type'},{status:400});
  }

  const {client,roles}=await requireOrgWorkspace(organizationId);
  const allowed=['company_admin','executive','hr_admin','training_admin','sdf','signatory','auditor'];
  if(!roles.some(r=>allowed.includes(r))){
    return NextResponse.json({error:'Not authorised for reporting exports'},{status:403});
  }
  const table=type==='wsp'?'wsp_plan_items':'atr_records';
  const cols=type==='wsp'?
    ['cycle_id','program_id','planned_learners','planned_cost','quarter','status']:
    ['cycle_id','event_id','evidence_state','status'];
  const {data,error}=await client.from(table).select(cols.join(','))
    .eq('organization_id',organizationId).limit(5000);
  if(error){
    return NextResponse.json({error:'Could not prepare internal draft export'},{status:500});
  }
  const rows: string[][]=[
    ['IMBHOLA INTERNAL WORKING DRAFT — NOT AN OFFICIAL SETA SUBMISSION FILE'],
    [type.toUpperCase() + ' records — no legal deadline or format verification implied'],
    cols,
    ...(data||[]).map(record=>cols.map(k=>(record as unknown as Record<string,unknown>)[k]===null?'':String((record as unknown as Record<string,unknown>)[k]??''))),
  ];
  const csv='\ufeff'+rows.map(row=>row.map(safeCell).join(',')).join('\r\n')+'\r\n';
  return new NextResponse(csv,{
    status:200,
    headers:{
      'Content-Type':'text/csv; charset=utf-8',
      'Content-Disposition':'attachment; filename="imbhola-internal-'+type+'-draft.csv"',
      'Cache-Control':'private, no-store, max-age=0',
      'X-Content-Type-Options':'nosniff',
    },
  });
}
