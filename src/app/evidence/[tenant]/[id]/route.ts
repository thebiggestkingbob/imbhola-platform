import { localDb } from '@/local/db';
import { readEvidence } from '@/local/reporting';
import { currentActor } from '@/local/session';

export async function GET(_: Request, { params }: { params: Promise<{tenant:string;id:string}> }) {
  const actor = await currentActor();
  if (!actor) return new Response(null,{status:404});
  const {tenant,id} = await params;
  const file = readEvidence(localDb(),actor,tenant,id);
  if (!file) return new Response(null,{status:404});
  return new Response(new Uint8Array(file.bytes),{headers:{
    'Content-Type':'application/octet-stream','X-Content-Type-Options':'nosniff',
    'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,'Cache-Control':'private, no-store',
  }});
}
