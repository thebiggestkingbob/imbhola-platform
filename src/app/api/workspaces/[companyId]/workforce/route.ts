import { createRemoteJWKSet } from 'jose';
import { Pool } from 'pg';
import { productionWorkspaceConfig } from '@/production/config';
import { verifyWorkspaceIdentity } from '@/production/identity';
import { createDescopeWorkspaceVerifier } from '@/production/descope';
import { readWorkforcePage } from '@/production/workforce';

export const runtime = 'nodejs';
const cache = {'Cache-Control':'private, no-store','Vary':'Authorization'};
const idPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

let connection: {pool:Pool;verify:ReturnType<typeof createDescopeWorkspaceVerifier>} | undefined;

export async function GET(request: Request, {params}: {params:Promise<{companyId:string}>}) {
  const config = productionWorkspaceConfig();
  if (!config) return Response.json({error:'Live workforce access is closed.'},{status:503,headers:cache});

  const {companyId} = await params;
  const after = new URL(request.url).searchParams.get('after') ?? '';
  if (!idPattern.test(companyId) || after.length > 500) {
    return Response.json({error:'Invalid company or page selection.'},{status:400,headers:cache});
  }

  if (!connection) {
    const oidcVerifier = () => {
      if (config.mode !== 'oidc') throw new Error('OIDC settings unavailable');
      const keys = createRemoteJWKSet(config.jwks,{timeoutDuration:4000});
      return (authorization: string | null) => verifyWorkspaceIdentity(authorization,keys,config);
    };
    connection = {
      pool:new Pool({connectionString:config.database,ssl:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:5000}),
      verify:config.mode === 'descope' ? createDescopeWorkspaceVerifier(config.projectId) : oidcVerifier(),
    };
  }
  const identity = await connection.verify(request.headers.get('Authorization'));
  if (!identity) return Response.json({error:'Verified sign-in with MFA is required.'},{status:401,headers:cache});

  try {
    const page = await readWorkforcePage(connection.pool,identity,companyId.toLowerCase(),after);
    if (!page) return Response.json({error:'Workspace unavailable.'},{status:404,headers:cache});
    return Response.json(page,{headers:cache});
  } catch {
    return Response.json({error:'Live workforce access is temporarily unavailable.'},{status:503,headers:cache});
  }
}
