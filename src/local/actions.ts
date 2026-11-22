'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookieName, digest, signIn } from './auth';
import { localDb } from './db';
import { localWorkspaceEnabled } from './mode';
import { acceptInvitation, captureLead, createCompany, createSupportRequest, register, requireOperations, resolveSupportRequest, saveCommercial, setMembership, updateCompany, verifyAccount } from './operations';
import { isRecordKind, saveRecord, workforceImport, type Data } from './records';
import { addEvidence, changeReport } from './reporting';
import { currentActor } from './session';

export type FormResult = {
  error?: string;
  message?: string;
  entries?: Data[];
  errors?: string[];
};

export async function workspaceAction(_: FormResult, form: FormData): Promise<FormResult> {
  if (!localWorkspaceEnabled()) return { error: 'This action is unavailable in the public preview.' };
  const field = (key: string) => String(form.get(key) ?? '');
  const task = field('task');
  const db = localDb();
  let destination: string | undefined;
  let result: FormResult = { message: 'Saved.' };
  try {
    if (task === 'lead') {
      captureLead(db,field('name'),field('email'),field('company'),field('purpose'),field('consent') === 'on');
      return { message: 'Synthetic request recorded for review.' };
    }
    if (task === 'register') {
      register(db,field('name'),field('email'),field('password'),field('kind'));
      return { message: 'Request recorded. An Imbhola operator must verify the synthetic account.' };
    }
    if (task === 'login') {
      const token = signIn(db,field('email'),field('password'));
      if (!token) return { error: 'Sign-in failed. Check your local credentials and account verification.' };
      (await cookies()).set(cookieName,token,{httpOnly:true,sameSite:'strict',maxAge:8 * 3600,path:'/'});
      destination = '/dashboard';
    } else if (task === 'logout') {
      const jar = await cookies();
      const token = jar.get(cookieName)?.value;
      if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
      jar.delete(cookieName);
      destination = '/login';
    } else {
      const actor = await currentActor();
      if (!actor) return { error: 'Sign in to continue.' };
      const tenant = field('tenant');
      switch (task) {
        case 'create':
          destination = '/workspace/' + createCompany(db,actor,field('name'));
          break;
        case 'profile':
          updateCompany(db,actor,tenant,field('sdl'),field('seta'),field('parent'));
          break;
        case 'membership':
          setMembership(db,actor,tenant,field('email'),field('role'),field('expiry'));
          break;
        case 'acceptInvitation':
          acceptInvitation(db,actor,tenant);
          break;
        case 'support':
          createSupportRequest(db,actor,tenant,field('title'),field('detail'));
          break;
        case 'resolveSupport':
          resolveSupportRequest(db,actor,field('id'));
          break;
        case 'verify':
          verifyAccount(db,actor,field('id'));
          break;
        case 'commercial':
          saveCommercial(db,actor,tenant,field('type'),field('name'),field('amount'),field('status'),field('reference'),field('id'));
          break;
        case 'record': {
          const kind = field('kind');
          if (!isRecordKind(kind)) return { error: 'Unknown record type.' };
          saveRecord(db,actor,tenant,kind,Object.fromEntries([...form.keys()].map(key => [key,field(key)])),field('id') || undefined);
          break;
        }
        case 'import': {
          const imported = workforceImport(db,actor,tenant,field('csv'),field('intent') === 'commit');
          result = { entries: imported.entries.slice(0,12), errors: imported.errors,
            message: imported.committed ? imported.entries.length + ' employees imported.' : imported.entries.length + ' rows ready to import.' };
          break;
        }
        case 'evidence': {
          const file = form.get('file');
          if (!(file instanceof File) || !file.size || file.size > 2_000_000) throw new Error('Choose a text fixture under 2 MB.');
          addEvidence(db,actor,tenant,field('training'),field('label'),file.name,file.type,new Uint8Array(await file.arrayBuffer()));
          break;
        }
        case 'report':
          changeReport(db,actor,tenant,Number(field('year')),field('transition'),Number(field('version')),field('note'));
          break;
        case 'leadStatus': {
          requireOperations(actor);
          // Keeping lead history append-only lets operations see each review.
          db.prepare(`INSERT INTO audit(tenant,user_id,action,subject,created_at)
            SELECT NULL,?,'lead.reviewed',id,? FROM leads WHERE id=?`).run(actor.id,new Date().toISOString(),field('id'));
          break;
        }
        default:
          return { error: 'Unknown action.' };
      }
      if (/^[a-z0-9-]+$/.test(tenant)) revalidatePath('/workspace/' + tenant);
      revalidatePath('/dashboard');
      revalidatePath('/sdf');
      revalidatePath('/admin');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The action could not be completed.';
    return { error: error instanceof Error && 'code' in error ? 'The database could not save this change.' : message };
  }
  if (destination) redirect(destination);
  return result;
}
