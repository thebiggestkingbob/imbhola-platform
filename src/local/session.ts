import { demoRuntimeEnabled, demoSessionCookie } from '@/demo/config';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cookieName, sessionActor } from './auth';
import { localDb } from './db';
import { localWorkspaceEnabled } from './mode';

export async function currentActor() {
  if (!localWorkspaceEnabled()) return;
  const token = (await cookies()).get(demoRuntimeEnabled() ? demoSessionCookie : cookieName)?.value;
  return token ? sessionActor(localDb(),token) : undefined;
}

export async function requireActor() {
  if (!localWorkspaceEnabled()) notFound();
  const actor = await currentActor();
  if (!actor) redirect('/login');
  return actor;
}
