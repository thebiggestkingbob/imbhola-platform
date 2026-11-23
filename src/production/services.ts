import { createRemoteJWKSet } from 'jose';
import { Pool } from 'pg';
import { pilotWorkspaceConfig, productionWorkspaceConfig } from './config.ts';
import { createDescopeWorkspaceVerifier } from './descope.ts';
import { verifyWorkspaceIdentity, type VerifiedIdentity } from './identity.ts';

export const privateHeaders = {'Cache-Control':'private, no-store','Vary':'Authorization'};
export const companyIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

let services: {pool:Pool;verify:(authorization:string|null)=>Promise<VerifiedIdentity|undefined>;pilot:boolean} | undefined;

export function workspaceServices() {
  if (services) return services;
  const pilot = pilotWorkspaceConfig();
  const config = pilot ?? productionWorkspaceConfig();
  if (!config) return;
  const verify = config.mode === 'descope' ? createDescopeWorkspaceVerifier(config.projectId) : (() => {
    const keys = createRemoteJWKSet(config.jwks,{timeoutDuration:4000});
    return (authorization: string | null) => verifyWorkspaceIdentity(authorization,keys,config);
  })();
  const pool = new Pool({connectionString:config.database,ssl:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:5000});
  pool.on('error',() => console.error('An idle workspace database connection was closed.'));
  services = {pool,verify,pilot:!!pilot};
  return services;
}

export function workspaceResponse(payload:unknown,status=200) {
  return Response.json(payload,{status,headers:privateHeaders});
}

export async function limitedWorkspaceJson(request:Request) {
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return;
  const reader = request.body?.getReader();
  if (!reader) return;
  const bytes = new Uint8Array(4096);
  let size = 0;
  try {
    while (true) {
      const {value,done} = await reader.read();
      if (done) return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size))) as unknown;
      if (size + value.length > bytes.length) {
        await reader.cancel();
        return;
      }
      bytes.set(value,size);
      size += value.length;
    }
  } catch {
    return;
  } finally {
    reader.releaseLock();
  }
}
