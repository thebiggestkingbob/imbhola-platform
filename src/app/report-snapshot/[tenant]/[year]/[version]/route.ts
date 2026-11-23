import { localDb } from '@/local/db';
import { frozenReport } from '@/local/reporting';
import { reportWorkbook } from '@/local/report-workbook';
import { currentActor } from '@/local/session';

export async function GET(request: Request, { params }: { params: Promise<{tenant:string;year:string;version:string}> }) {
  const actor = await currentActor();
  if (!actor) return new Response(null,{status:404});
  const {tenant,year,version} = await params;
  const snapshot = frozenReport(localDb(),actor,tenant,year,version);
  if (!snapshot) return new Response(null,{status:404});
  const format = new URL(request.url).searchParams.get('format');
  if (format === 'xlsx') {
    const versionNumber = String(Number(version));
    const bytes = await reportWorkbook(snapshot,versionNumber);
    return new Response(new Uint8Array(bytes),{headers:{
      'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':'attachment; filename="imbhola-internal-' + snapshot.report.year + '-v' + versionNumber + '.xlsx"',
      'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff',
    }});
  }
  return Response.json({
    purpose:'Internal synthetic snapshot', sha256:snapshot.digest, status:snapshot.status,
    signedBy:snapshot.signedBy, signedAt:snapshot.signedAt, report:snapshot.report,
  },{headers:{
    'Content-Disposition':'attachment; filename="imbhola-internal-snapshot.json"',
    'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff',
  }});
}
