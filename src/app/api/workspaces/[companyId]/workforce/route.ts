import { companyIdPattern, limitedWorkspaceJson, workspaceResponse, workspaceServices } from '@/production/services';
import { readWorkforcePage, validateWorkforceEdit, writeWorkforceEntry } from '@/production/workforce';

export const runtime = 'nodejs';
type Params = {params:Promise<{companyId:string}>};

export async function GET(request:Request,{params}:Params) {
  const connection = workspaceServices();
  if (!connection) return workspaceResponse({error:'Live workforce access is closed.'},503);
  const {companyId} = await params;
  const after = new URL(request.url).searchParams.get('after') ?? '';
  if (!companyIdPattern.test(companyId) || after.length > 500) {
    return workspaceResponse({error:'Invalid company or page selection.'},400);
  }
  const identity = await connection.verify(request.headers.get('Authorization'));
  if (!identity) return workspaceResponse({error:'Verified sign-in with MFA is required.'},401);
  try {
    const page = await readWorkforcePage(connection.pool,identity,companyId.toLowerCase(),after);
    return page ? workspaceResponse(page) : workspaceResponse({error:'Workspace unavailable.'},404);
  } catch {
    return workspaceResponse({error:'Live workforce access is temporarily unavailable.'},503);
  }
}

export async function POST(request:Request,{params}:Params) {
  const connection = workspaceServices();
  if (!connection?.pilot) return workspaceResponse({error:'Workforce editing is closed.'},503);
  const {companyId} = await params;
  if (!companyIdPattern.test(companyId)) return workspaceResponse({error:'Invalid company selection.'},400);
  const identity = await connection.verify(request.headers.get('Authorization'));
  if (!identity) return workspaceResponse({error:'Sign in again and complete both verification steps.'},401);
  const edit = validateWorkforceEdit(await limitedWorkspaceJson(request));
  if (!edit) return workspaceResponse({error:'Check the employee number, job title, department and status.'},400);
  try {
    const result = await writeWorkforceEntry(connection.pool,identity,companyId.toLowerCase(),edit);
    if (!result) return workspaceResponse({error:'Company or employee unavailable.'},404);
    if (result.outcome === 'duplicate') return workspaceResponse({error:'That employee number already exists.'},409);
    return workspaceResponse({employee:result.employee},edit.intent === 'create' ? 201 : 200);
  } catch {
    return workspaceResponse({error:'The employee could not be saved right now.'},503);
  }
}
