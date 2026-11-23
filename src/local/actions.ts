'use server';

import { demoPath, demoRuntimeEnabled, demoSessionCookie } from '@/demo/config';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookieName, digest, issueSession, signIn } from './auth';
import { localDb } from './db';
import { localWorkspaceEnabled, reviewWorkspaceEnabled } from './mode';
import { acceptInvitation, captureLead, createCompany, createSupportRequest, recordReportingSource, register, requireOperations, resolveSupportRequest, saveCommercial, setMembership, updateCompany, verifyAccount } from './operations';
import { isRecordKind, saveRecord, workforceImport, type Data } from './records';
import { addEvidence, changeReport, evidenceSizeLimit } from './reporting';
import { hasReviewCookie, reviewAccounts, reviewCookieName } from './review-gate';
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
  const demo = demoRuntimeEnabled();
  const roleCookie = demo ? demoSessionCookie : cookieName;
  const cookiePath = demo ? demoPath : '/';
  const db = localDb();
  let destination: string | undefined;
  let result: FormResult = { message: 'Saved.' };
  try {
    if (task === 'lead') {
      captureLead(db,field('name'),field('email'),field('company'),field('purpose'),field('consent') === 'on');
      return { message: 'Synthetic request recorded for review.' };
    }
    if (task === 'register') {
      if (demo) return {error:'Choose a sample role to use this workspace.'};
      register(db,field('name'),field('email'),field('password'),field('kind'));
      return { message: 'Request recorded. An Imbhola operator must verify the synthetic account.' };
    }
    if (task === 'demoLogin' || task === 'login' || task === 'reviewLogin') {
      if (demo !== (task === 'demoLogin')) return {error:'Use the sign-in form for this workspace.'};
      const jar = await cookies();
      let email = field('email');
      let password = field('password');
      if (task === 'reviewLogin') {
        const reviewPassword = process.env.IMBHOLA_REVIEW_PASSWORD;
        const account = field('account');
        if (!reviewWorkspaceEnabled() || !reviewPassword || !reviewAccounts.some(([id]) => id === account) ||
            !hasReviewCookie(jar.get(reviewCookieName)?.value,reviewPassword)) {
          return {error:'Unlock the private review before choosing a test account.'};
        }
        email = account + '@imbhola.test';
        password = reviewPassword;
      }
      const account = field('account');
      const token = demo ? (reviewAccounts.some(([id]) => id === account) ? issueSession(db,account) : undefined) : signIn(db,email,password);
      if (!token) return { error: 'Sign-in failed. Check your local credentials and account verification.' };
      const previous = jar.get(roleCookie)?.value;
      if (previous) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(previous));
      jar.set(roleCookie,token,{httpOnly:true,secure:demo || reviewWorkspaceEnabled(),sameSite:'strict',maxAge:8 * 3600,path:cookiePath});
      destination = '/dashboard';
    } else if (task === 'logout') {
      const jar = await cookies();
      const token = jar.get(roleCookie)?.value;
      if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
      if (demo) jar.set(roleCookie,'',{path:cookiePath,secure:true,httpOnly:true,maxAge:0});
      else jar.delete(roleCookie);
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
          if (!(file instanceof File) || !file.size || file.size > evidenceSizeLimit) throw new Error('Choose a synthetic evidence file up to 2 MB.');
          addEvidence(db,actor,tenant,field('training'),field('label'),file.name,new Uint8Array(await file.arrayBuffer()));
          break;
        }
        case 'report':
          changeReport(db,actor,tenant,Number(field('year')),field('transition'),Number(field('version')),field('note'));
          break;
        case 'reportingSource':
          recordReportingSource(db,actor,{year:field('year'),title:field('title'),revision:field('revision'),
            url:field('url'),sha256:field('sha256')});
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
