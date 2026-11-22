import { localDb } from '@/local/db';
import { frozenReport } from '@/local/reporting';
import { currentActor } from '@/local/session';

export async function GET(_: Request, { params }: { params: Promise<{tenant:string;year:string;version:string}> }) {
  const actor = await currentActor();
  if (!actor) return new Response(null,{status:404});
  const {tenant,year,version} = await params;
  const snapshot = frozenReport(localDb(),actor,tenant,year,version);
  if (!snapshot) return new Response(null,{status:404});
  return Response.json({
    purpose:'Internal synthetic snapshot', sha256:snapshot.digest, status:snapshot.status,
    signedBy:snapshot.signedBy, signedAt:snapshot.signedAt, report:snapshot.report,
  },{headers:{
    'Content-Disposition':'attachment; filename="imbhola-internal-snapshot.json"',
    'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff',
  }});
}
