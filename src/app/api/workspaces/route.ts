import { companyIdPattern, workspaceResponse, workspaceServices } from '@/production/services';
import { listWorkspaces } from '@/production/workspace-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request:Request) {
  const connection = workspaceServices();
  if (!connection?.pilot) return workspaceResponse({error:'The private pilot is closed.'},503);
  const after = new URL(request.url).searchParams.get('after');
  if (after !== null && !companyIdPattern.test(after)) return workspaceResponse({error:'Invalid page selection.'},400);
  const identity = await connection.verify(request.headers.get('Authorization'));
  if (!identity) return workspaceResponse({error:'Sign in again and complete both verification steps.'},401);
  try {
    const list = await listWorkspaces(connection.pool,identity,after);
    return list ? workspaceResponse(list) : workspaceResponse({error:'This account has no pilot access.'},403);
  } catch {
    return workspaceResponse({error:'Company workspaces are temporarily unavailable.'},503);
  }
}
