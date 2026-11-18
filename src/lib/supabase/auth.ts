import 'server-only';
import { createSupabaseServerClient } from './server';

/** Verified identity lookup; never use an unverified session as proof of authorization. */
export async function getVerifiedUser() {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at) return null;
  return data.user;
}
