import { roleFor } from '@/local/auth';
import { localDb } from '@/local/db';
import { currentActor } from '@/local/session';

export async function GET(_: Request, { params }: { params: Promise<{tenant:string;id:string}> }) {
  const actor = await currentActor();
  if (!actor) return new Response(null,{status:404});
  const {tenant,id} = await params;
  const db = localDb();
  const role = roleFor(db,actor,tenant);
  if (!role || !['owner','sdf','training','committee','signatory','finance'].includes(role)) return new Response(null,{status:404});
  const file = db.prepare('SELECT filename,bytes FROM evidence WHERE tenant=? AND id=?').get(tenant,id);
  if (!file) return new Response(null,{status:404});
  return new Response(new Uint8Array(file.bytes as Uint8Array),{headers:{
    'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff',
    'Content-Disposition':'attachment; filename="' + file.filename + '"','Cache-Control':'private, no-store',
  }});
}
