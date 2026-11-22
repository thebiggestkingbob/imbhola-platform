import { digest, roleFor } from '@/local/auth';
import { localDb } from '@/local/db';
import { currentActor } from '@/local/session';

export async function GET(_: Request, { params }: { params: Promise<{tenant:string;year:string;version:string}> }) {
  const actor = await currentActor();
  if (!actor) return new Response(null,{status:404});
  const {tenant,year,version} = await params;
  const db = localDb();
  const role = roleFor(db,actor,tenant);
  if (!role || !['owner','sdf','committee','signatory'].includes(role)) return new Response(null,{status:404});
  const row = db.prepare(`SELECT snapshot,digest,status,signed_by,signed_at FROM reports
    WHERE tenant=? AND year=? AND version=?`).get(tenant,year,version);
  if (!row || digest(String(row.snapshot)) !== row.digest) return new Response(null,{status:404});
  return Response.json({
    purpose:'Internal synthetic snapshot', sha256:row.digest, status:row.status,
    signedBy:row.signed_by, signedAt:row.signed_at, report:JSON.parse(String(row.snapshot)),
  },{headers:{
    'Content-Disposition':'attachment; filename="imbhola-internal-snapshot.json"',
    'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff',
  }});
}
